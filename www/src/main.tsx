import { render } from "endr";
import App from "./App";

const { document } = globalThis;

render(<App />, document.getElementById("root"));
