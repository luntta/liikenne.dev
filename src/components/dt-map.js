import { escapeHtml } from "../utils.js";

class DtMap extends HTMLElement {
  connectedCallback() {
    this.init();
  }

  init() {
    if (this._initialized) return;
    const configAttr = this.getAttribute("data-config");
    if (!configAttr) return;

    let config;
    try {
      config = JSON.parse(configAttr);
    } catch {
      return;
    }

    this._initialized = true;
    const { bounds, points = [], lines = [], polygons = [], legend = [] } = config;

    this.innerHTML = `
      <div class="map-shell">
        <div class="map-frame">
          <div data-map-container></div>
        </div>
        ${
          legend.length
            ? `
          <div class="map-legend">
            ${legend
              .map(
                (item) => `
              <span class="legend-item">
                <span class="legend-swatch" style="background:${this._resolveColor(item.color)}"></span>
                ${escapeHtml(item.label)}
              </span>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;

    const container = this.querySelector("[data-map-container]");
    if (!container || typeof L === "undefined") return;

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    const isDark = document.documentElement.dataset.theme === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    const leafletBounds = L.latLngBounds(
      [bounds.minLat, bounds.minLon],
      [bounds.maxLat, bounds.maxLon],
    );
    map.fitBounds(leafletBounds, { padding: [20, 20] });

    for (const point of points) {
      const color = this._resolveColor(point.color);
      L.circleMarker([point.lat, point.lon], {
        radius: point.radius || 4,
        fillColor: color,
        fillOpacity: point.opacity ?? 0.85,
        color: color,
        weight: 1,
        opacity: 0.6,
      })
        .bindTooltip(point.title || point.label || "", {
          direction: "top",
          offset: [0, -6],
        })
        .addTo(map);
    }

    for (const line of lines) {
      const coords = line.coordinates.map(([lon, lat]) => [lat, lon]);
      L.polyline(coords, {
        color: this._resolveColor(line.color || "var(--accent-solid)"),
        weight: line.width || 2,
        opacity: 0.7,
        dashArray: line.dasharray || null,
      }).addTo(map);
    }

    for (const polygon of polygons) {
      const coords = polygon.coordinates.map(([lon, lat]) => [lat, lon]);
      L.polygon(coords, {
        color: this._resolveColor(polygon.color || "var(--accent-solid)"),
        fillColor: this._resolveColor(polygon.fill || "transparent"),
        weight: polygon.width || 1.5,
        fillOpacity: 0.3,
      }).addTo(map);
    }

    this._map = map;
    this._observer = new MutationObserver(() => this._updateTiles());
    this._observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this._map?.remove();
  }

  _updateTiles() {
    if (!this._map) return;
    this._map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) this._map.removeLayer(layer);
    });
    const isDark = document.documentElement.dataset.theme === "dark";
    const url = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    L.tileLayer(url, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(this._map);
  }

  _resolveColor(value) {
    if (!value || !value.startsWith("var(")) return value;
    const prop = value.match(/var\((--[^)]+)\)/)?.[1];
    if (!prop) return value;
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(prop)
        .trim() || value
    );
  }
}

customElements.define("dt-map", DtMap);
