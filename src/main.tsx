import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SettingsProvider } from "@/features/settings/store";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme";
import "@/styles/globals.css";
import "@/styles/base.css";
// Side-effect: apply theme before render (CSP-safe, bundled).
import "@/theme-init";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
