// Resolve relative to the document so GitHub Pages project paths keep working.
// Replace the landing page to avoid trapping the browser's Back button.
const destination = new URL("./pixel.html", window.location.href);
destination.search = window.location.search;
destination.hash = window.location.hash;
window.location.replace(destination.href);
