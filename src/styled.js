import clsx from "clsx";
import React from "react";
import { css } from "./css";

// Part 1: styled('button'): element of type tagName to render
export function styled(tagName) {
  // Part 2: style('button')({ color: 'white' }) takes in the style object and applies these styles to `tagName=button` component

  return function applyStyles(styleObject) {
    // Part 3: `Button` react component
    return function Component(props) {
      // ...styling and element creation...
      const clonedProps = clone(props);
      // a copy of props is required as by default react makes props immutable
      // and if we want to modify any props we need to make a copy for our use

      // compute a className for styleObject
      const generatedClassName = css(styleObject);

      // compose className
      const className = clsx(generatedClassName, props.className);
      // reassign composed className
      clonedProps.className = className;

      console.log({ clonedProps, generatedClassName });

      // create element of type `tagName` with props = `clonedProps` and `style=generateClassName`
      const element = React.createElement(tagName, clonedProps);

      // The `element` is of type `tagName` and of `styles=styleObject` this is one we want to render

      return element;
    };
  };
}

function clone(obj) {
  return Object.assign({}, obj);
}
