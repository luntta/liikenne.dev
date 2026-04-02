import { escapeHtml } from "./utils.js";

function alphaToken(index) {
  let value = index + 1;
  let token = "";
  while (value > 0) {
    value -= 1;
    token = String.fromCharCode(65 + (value % 26)) + token;
    value = Math.floor(value / 26);
  }
  return token;
}

function highlightJavaScript(code) {
  const placeholders = [];
  let raw = code;

  function stash(regex, className) {
    raw = raw.replace(regex, (match) => {
      const token = `__TOKEN_${alphaToken(placeholders.length)}__`;
      placeholders.push({
        token,
        html: `<span class="${className}">${escapeHtml(match)}</span>`,
      });
      return token;
    });
  }

  stash(
    /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g,
    "syntax-string",
  );
  stash(/\/\/[^\n]*/g, "syntax-comment");

  let html = escapeHtml(raw);
  html = html.replace(
    /\b\d+(?:\.\d+)?\b/g,
    '<span class="syntax-number">$&</span>',
  );
  html = html.replace(
    /\b(?:const|let|var|return|await|async|if|else|for|while|switch|case|break|continue|function|new|try|catch|throw|import|from|export|default|class|null|true|false)\b/g,
    '<span class="syntax-keyword">$&</span>',
  );
  html = html.replace(
    /\b(?:undefined)\b/g,
    '<span class="syntax-bool">$&</span>',
  );

  [...placeholders].reverse().forEach((item) => {
    html = html.replaceAll(item.token, item.html);
  });
  return html;
}

function highlightJson(code) {
  let raw = code;
  const placeholders = [];

  raw = raw.replace(/"(?:\\.|[^"\\])*"/g, (match) => {
    const token = `__JSON_${placeholders.length}__`;
    placeholders.push({
      token,
      html: `<span class="syntax-string">${escapeHtml(match)}</span>`,
    });
    return token;
  });

  let html = escapeHtml(raw);
  html = html.replace(
    /\b\d+(?:\.\d+)?\b/g,
    '<span class="syntax-number">$&</span>',
  );
  html = html.replace(
    /\b(?:true|false|null)\b/g,
    '<span class="syntax-bool">$&</span>',
  );
  placeholders.forEach((item) => {
    html = html.replaceAll(item.token, item.html);
  });
  return html;
}

function highlightHttp(code) {
  return escapeHtml(code)
    .replace(
      /^(GET|POST|PUT|PATCH|DELETE|OPTIONS)(\s+)/gm,
      '<span class="syntax-method">$1</span>$2',
    )
    .replace(/https:\/\/[^\s`]+/g, '<span class="syntax-path">$&</span>');
}

export function highlightCode(code, language) {
  if (language === "json") return highlightJson(code);
  if (language === "http") return highlightHttp(code);
  return highlightJavaScript(code);
}
