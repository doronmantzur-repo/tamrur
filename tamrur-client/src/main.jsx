// React
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// External libraries
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";

// Internal application modules
import App from "./App.jsx";
import { appTheme, cssVariablesResolver } from "./theme";
// Styles
import "@mantine/core/styles.css";
import "./index.css";

/**
 * Starts the Hebrew right-to-left React application with the shared Mantine theme.
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <DirectionProvider initialDirection="rtl">
        <MantineProvider
          theme={appTheme}
          cssVariablesResolver={cssVariablesResolver}
          defaultColorScheme="dark"
        >
          <App />
        </MantineProvider>
      </DirectionProvider>
    </BrowserRouter>
  </StrictMode>,
);
