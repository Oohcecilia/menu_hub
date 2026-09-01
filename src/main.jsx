import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'

function showStartupError(error) {
  const root = document.getElementById("root");

  if (!root) return;

  const startupError = {
    name: error?.name || "Error",
    message: error?.message || String(error),
  };
  window.__MENU_STARTUP_ERROR__ = {
    name: startupError.name,
    message: startupError.message,
  };
  root.dataset.startupErrorName = startupError.name;
  root.dataset.startupErrorMessage = startupError.message;
  console.error("__MENU_STARTUP_ERROR__", startupError.name, startupError.message);
  root.innerHTML = `
    <div style="min-height:100vh;background:#0b0c0f;color:#f8fafc;padding:24px;font-family:system-ui,sans-serif;">
      <h1 style="font-size:20px;margin:0 0 12px;">Menu could not start</h1>
      <p style="margin:0;color:#cbd5e1;">Please reload the page.</p>
    </div>
  `;
}

class StartupErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    const root = document.getElementById("root");

    if (root) {
      root.dataset.startupComponentStack = String(info?.componentStack || "").slice(0, 1200);
    }

    showStartupError(error);
  }

  render() {
    return this.props.children;
  }
}

window.addEventListener("error", (event) => {
  showStartupError(event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showStartupError(event.reason);
});

async function startApp() {
  try {
    const { default: App } = await import('@/App.jsx');

    ReactDOM.createRoot(document.getElementById("root")).render(
      <StartupErrorBoundary>
        <App />
      </StartupErrorBoundary>
    );
  } catch (error) {
    showStartupError(error);
  }
}

startApp();
