import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppWrapper from "./AppWrapper";
import { DatasetProvider } from "./context/DatasetContext";
import './index.css';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <DatasetProvider>
        <AppWrapper />
      </DatasetProvider>
    </BrowserRouter>
  </React.StrictMode>
);
