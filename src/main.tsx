import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { startKeepAlive } from "./utils/keepAlive";

createRoot(document.getElementById("root")!).render(<App />);

// Inicia o sistema de keep-alive para evitar que o backend durma
startKeepAlive();