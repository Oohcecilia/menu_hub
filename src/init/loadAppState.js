export async function loadAppState() {
  try {
    const [sessionRes, settingsRes] = await Promise.all([
      fetch("/api/auth/me", { credentials: "include" }),
      fetch("/api/public-settings"),
    ]);

    const session = sessionRes.ok ? await sessionRes.json() : null;
    const settings = settingsRes.ok ? await settingsRes.json() : null;

    return {
      session,
      settings,
    };
  } catch (error) {
    console.error("App init failed:", error);

    return {
      session: null,
      settings: null,
    };
  }
}