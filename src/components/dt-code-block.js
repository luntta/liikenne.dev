import { icons } from "../icons.js";
import { escapeHtml, copyToClipboard } from "../utils.js";
import { t } from "../i18n.js";
import { highlightCode } from "../highlight.js";

class DtCodeBlock extends HTMLElement {
  connectedCallback() {
    const code = this.getAttribute("code") || "";
    const language = this.getAttribute("language") || "javascript";
    const label = this.getAttribute("copy-label") || t("copy");
    this.innerHTML = `
      <div class="code-shell">
        <button class="btn-secondary btn-tiny copy-button" type="button">${icons.copy} ${escapeHtml(label)}</button>
        <pre class="code-block"><code>${highlightCode(code, language)}</code></pre>
      </div>
    `;
    this.querySelector(".copy-button").addEventListener("click", () =>
      copyToClipboard(code),
    );
  }
}

customElements.define("dt-code-block", DtCodeBlock);
