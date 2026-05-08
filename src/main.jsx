import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { loadAppState } from "./init/loadAppState";

async function startApp() {
  // const { session, settings } = await loadAppState();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <App />
  );
}

startApp();