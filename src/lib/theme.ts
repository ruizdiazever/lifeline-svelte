/**
 * Minimal theme detection/toggling (replaces next-themes for the
 * fireworks effect). Reads the `dark` class on <html>, falling back
 * to the OS preference.
 */
export function getTheme(): "light" | "dark" {
  if (document.documentElement.classList.contains("dark")) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
