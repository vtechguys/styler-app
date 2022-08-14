import { css, keyframes } from "./css";

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
    </div>
  );
}
