// it is a map of "stringified-style-object" to "hashed-classname"
const style_classname_cache = {};
// it is a map of "hashed-classname" to "css-string"
const classname_css_cache = {};
// it is map of "css-string" to injected-status (true = injected)
const inserted_styles_cache = {};

function _css_(styles, options) {
  // 1. convert to valid style-object
  const _style_object_ = getValidStyleObject(styles);

  // 2. generate unique className
  const className = getClassName(_style_object_);

  // 3. Parse the style-object to generate valid CSS styles and attach them to className
  let CSS = classname_css_cache[className];

  if (!CSS) {
    CSS = parseStyles(
      options?.hasKeyframes
        ? { [`@keyframes ${className}`]: _style_object_ }
        : _style_object_,
      `.${className}`
    ); // <-- Step 3
    classname_css_cache[className] = CSS;
  }

  // 4. Create or update the stylesheet in DOM
  injectStyles(CSS);

  // return className to be applied on element
  return className;
}

// Step 1: convert to valid style-object
function getValidStyleObject(styles) {
  let style_object = styles;

  if (Array.isArray(styles)) {
    style_object = merge(styles);
  }

  return style_object;
}

function merge(styles) {
  // (*) shallow merge
  return styles.reduce((acc, style) => Object.assign(acc, style), {});
}

// Step 2: generate unique className
const stringify = (object) => JSON.stringify(object);
// quick hashing algorithm example: https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781
const hash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36);
};

function getClassName(styleObject) {
  const stringified = stringify(styleObject);

  // pick the cached className to optimize and skip hashing every time
  let className = style_classname_cache[stringified];

  // if there is not an entry for this stringified style means it is new
  // so generate a hashed className and register and entry of style

  if (!className) {
    // use any quick hashing algorithm
    // example: https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781

    const hashed = hash(stringified);
    // prefix some string to indicate it is generated from lib
    // it also makes sure that className is valid
    const _class_name_ = `css-${hashed}`;

    // hashing is costly so make an entry for the generated className
    style_classname_cache[stringified] = _class_name_;

    className = style_classname_cache[stringified];
  }

  return className;
}

// Step 3:

function parseStyles(style_object, selector) {
  // This collects `@import` rules  which are independent of any selector
  let outer = "";

  // This is for block rules collected
  let blocks = ""; // (2)

  // This is for the currently processed style-rule
  let current = "";

  // each property of style_object can be a rule (3)
  // or a nested styling 7, 8
  for (const key in style_object) {
    const value = style_object[key];

    // @ rules are specific and may be further nested
    // @media rules are essentially redefining styles on-screen breakpoints
    // so they need to be processed first
    const isAtRule = key[0] === "@";

    if (isAtRule) {
      // There are 4 main at-rules
      // 1. @import
      // 2. @font-face
      // 3. @keyframe
      // 4. @media

      const isImportRule = key[1] === "i";
      const isFontFaceRule = key[1] === "f";
      const isKeyframeRule = key[1] === "k";

      if (isImportRule) {
        // import is an outer rule declaration
        outer += key + " " + value; // @import nav.css
      } else if (isFontFaceRule) {
        // font face rules are global block rules but don't need a bound selector
        blocks += parseStyles(value, key);
      } else if (isKeyframeRule) {
        // keyframe rule are processed differently by our `css` function
        // which we should see implementation at a later point
        blocks += key + "{" + parseStyles(value, "") + "}";
      } else {
        // @media rules are essentially redefining CSS on breakpoints
        // they are nested rules and are bound to selector
        blocks += key + "{" + parseStyles(value, selector) + "}";
      }
    }
    // beside the At-Rules there are other nested rules
    // 4, 5, 6
    else if (typeof value === "object") {
      // the nested rule can be simple as "&:hover"
      // or a group of selectors like "&:hover, &:active" or
      // "&:hover .wrapper"
      // "&:hover [data-toggled]"
      // many such complex selector we will have to break them into simple selectors
      // "&:active, &:hover" should be simplified to "&:hover" and "&:active"
      // finally removing self-references (&) with class-name(root-binding `selector`)
      const selectors = selector
        ? // replace multiple selectors
          selector.replace(/([^,])+/g, (_seletr) => {
            // check the key for '&:hover' like

            return key.replace(/(^:.*)|([^,])+/g, (v) => {
              // replace self-references '&' with '_seletr'

              if (/&/.test(v)) return v.replace(/&/g, _seletr);

              return _seletr ? _seletr + " " + v : v;
            });
          })
        : key;
      // each of these nested selectors create their own blocks
      // &:hover {} has its own block
      blocks += parseStyles(value, selectors);
    }
    // now that we have dealt with object `value`
    // it means we are a simple style-rules (3)
    // style-rule values should not be undefined or null
    else if (value !== undefined) {
      // in JavaScript object keys are camelCased by default
      // i.e "textAlign" but it is not a valid CSS property
      // so we should convert it to valid CSS-property i.e "text-align"

      // Note: the key can be a CSS variable that starts from "--"
      // which need to remain as it is as they will be referred by value in code somewhere.
      const isVariable = key.startsWith("--");

      // prop value as per CSS "text-align" not "textAlign"
      const cssProp = isVariable
        ? key
        : key.replace(/[A-Z]/g, "-$&").toLowerCase();

      // css prop is written as "<prop>:<value>;"
      current += cssProp + ":" + value + ";";
    }
  }

  return (
    // outer are independent rules
    // and it is most likely to be the @import rule so it goes first
    outer +
    // if there are any current rules (style-rule)(3)
    // attach them to selector-block if any else attach them there
    (selector && current ? selector + "{" + current + "}" : current) +
    // all block-level CSS goes next
    blocks
  );
}

// Step 4: Create or update the stylesheet in DOM
const fake_sheet = {
  data: ""
};

function injectStyles(css_string) {
  // create and get the style-tag; return the text node directly
  const stylesheet = getStyleSheet();

  // if already inserted style in the sheet we might ignore this call
  const hasInsertedInSheet = inserted_styles_cache[css_string];
  // these styles need to be inserted
  if (!hasInsertedInSheet) {
    stylesheet.data += css_string; // <-- inserted style in sheet
    inserted_styles_cache[css_string] = true; // <-- mark the insertion
  }
}

function getStyleSheet() {
  // we aren't in the browser env so our fake_sheet will work
  if (typeof window === "undefined") {
    return fake_sheet;
  }

  const style = document.head.querySelector("#css-in-js");

  if (style) {
    return style.firstChild; // <-- text-node containing styles
  }

  // style doesn't already exist create a style-element
  const styleTag = document.createElement("style");

  styleTag.setAttribute("id", "css-in-js");
  styleTag.innerHTML = " ";

  document.head.appendChild(styleTag);

  return styleTag.firstChild; // <-- text-node containing styles
}

export const css = (styles) => _css_(styles, {});
export const keyframes = (keyframeStyle) =>
  _css_(keyframeStyle, { hasKeyframes: true });
