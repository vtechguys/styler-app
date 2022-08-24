import { css, keyframes } from "./css";
import { styled } from "./styled";

const bounceAnimationName = keyframes({
  "from, 20%, 53%, 80%, to": {
    transform: "translate3d(0,0,0)"
  },
  "40%, 43%": {
    transform: "translate3d(0, -30px, 0)"
  },
  "70%": {
    transform: "translate3d(0, -15px, 0)"
  },
  "90%": {
    transform: "translate3d(0,-4px,0)"
  }
});

const growAnimationName = keyframes({
  from: { transform: "scale(1)" },
  to: { transform: "scale(2) " }
});

const Link = styled("a")({
  backgroundColor: "orange",
  color: "white",
  fontWeight: 600,
  fontSize: 16,
  padding: "8px 16px",
  margin: "20px"
});

export default function App() {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px"
      })}
    >
      <h1>Styler</h1>
      <img
        src="/sx.png"
        alt="logo"
        className={css({
          height: "150px",
          width: "150px",
          "&:hover": {
            animation: `${growAnimationName} 500ms ease-in-out`
          }
        })}
      />
      <div className={css({ margin: "10px" })}></div>
      <div
        className={css({
          height: "60px",
          "&:hover": {
            color: "red",
            animation: `${bounceAnimationName} 1s ease-in-out`
          }
        })}
      >
        Bounce on hover
      </div>
      <a href="https://github.com/vtechguys/styler">Github</a>
      <Link href="https://aniketjha.dev">Blog</Link>
    </div>
  );
}
