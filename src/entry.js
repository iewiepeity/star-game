// Resolve relative to the document so GitHub Pages project paths keep working.
// Replace the legacy entry to avoid trapping the browser's Back button.
const destination = new URL("./", window.location.href);
destination.search = window.location.search;
destination.hash = window.location.hash;
window.location.replace(destination.href);
