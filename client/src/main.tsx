import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import fonts
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";

createRoot(document.getElementById("root")!).render(<App />);
