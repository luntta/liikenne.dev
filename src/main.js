import { initLang } from "./i18n.js";
import { initialTheme, applyTheme } from "./theme.js";
import { store } from "./store.js";
import { selectedFromHash } from "./router.js";
import "./components/dt-app.js";

initLang();
applyTheme(initialTheme());
store.set({ selectedId: selectedFromHash() });
