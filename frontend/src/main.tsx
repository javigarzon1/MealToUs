import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "../CSS/index.css";
import "../CSS/header.css";
import "../CSS/form&button.css";
import "../CSS/warnings&labels.css";
import "../CSS/menu&dish.css";
import "../CSS/chat.css";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
