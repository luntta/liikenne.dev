import { staticDemos } from "./demos/data.js";
import { demoT } from "./i18n.js";

class Store extends EventTarget {
  constructor(initial) {
    super();
    this._state = initial;
  }

  get state() {
    return this._state;
  }

  set(updates) {
    const prev = { ...this._state };
    Object.assign(this._state, updates);
    this.dispatchEvent(
      new CustomEvent("change", { detail: { prev, state: this._state } }),
    );
  }
}

export const store = new Store({
  demos: staticDemos,
  search: "",
  filter: "all",
  selectedId: null,
  previewCache: new Map(),
});

export function filteredDemos() {
  const { demos, search, filter } = store.state;
  const query = search.trim().toLowerCase();
  return demos.filter((demo) => {
    const domainMatch = filter === "all" || demo.domain === filter;
    if (!domainMatch) return false;
    if (!query) return true;
    const title = demoT(demo.id, "title", demo.title);
    const desc = demoT(demo.id, "description", demo.description);
    return [title, desc, demo.title, demo.description, demo.whatUserSees, demo.apis.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}
