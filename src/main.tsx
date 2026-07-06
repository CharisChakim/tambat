import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Catatan: StrictMode sengaja tidak dipakai karena efek ganda di dev mode
// akan memicu dua kali koneksi SSH per tab.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
