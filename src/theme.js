export function initialTheme() {
  const saved = window.localStorage.getItem("digitraffic-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("digitraffic-theme", theme);
}

export function toggleTheme() {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  document
    .querySelectorAll("dt-nav")
    .forEach((el) => el.updateThemeIcon());
}
