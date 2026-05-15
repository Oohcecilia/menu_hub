const API_BASE = import.meta.env.VITE_API_URL || "/api/menu.php";

export async function getMenuData() {
  try {
    
    const res = await fetch(`${API_BASE}`);

    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    return await res.json();

  } catch (error) {
    console.error("getMenuData error:", error);
  }
}









