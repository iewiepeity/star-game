import { esc } from "./utils.js";

const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "em",
  "span",
  "small",
  "p",
  "section",
  "aside",
  "h3",
  "ul",
  "li",
  "br",
]);
const SAFE_CLASS = /^[a-z0-9 _-]{1,120}$/i;

export function sanitizeRichText(value) {
  const source = String(value ?? "");
  let output = "",
    cursor = 0;
  const openTags = [];
  for (const match of source.matchAll(
    /<\/?([a-z][\w-]*)(?:\s+([^<>]*))?\s*\/?>/gi,
  )) {
    output += esc(source.slice(cursor, match.index));
    const tag = match[1].toLowerCase(),
      closing = match[0].startsWith("</");
    if (ALLOWED_TAGS.has(tag)) {
      if (closing) {
        if (openTags.at(-1) === tag) {
          openTags.pop();
          output += `</${tag}>`;
        } else output += esc(match[0]);
      } else {
        const className = match[2]?.match(
          /(?:^|\s)class\s*=\s*["']([^"']+)["']/i,
        )?.[1];
        output += `<${tag}${className && SAFE_CLASS.test(className) ? ` class="${esc(className)}"` : ""}${tag === "br" ? "/" : ""}>`;
        if (tag !== "br") openTags.push(tag);
      }
    } else output += esc(match[0]);
    cursor = match.index + match[0].length;
  }
  return (
    output +
    esc(source.slice(cursor)) +
    openTags
      .reverse()
      .map((tag) => `</${tag}>`)
      .join("")
  );
}
