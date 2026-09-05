// Original 16 × 16 menu glyphs. Rectilinear shapes remain crisp at every UI size.
const paths = {
  schedule: "M3 3H13V14H3ZM5 1V5M11 1V5M3 7H13M6 9H7V10H6ZM9 9H10V10H9ZM6 12H7",
  travel: "M2 5L6 3L10 5L14 3V13L10 15L6 13L2 15ZM6 3V13M10 5V15",
  creative: "M3 3H10V14H3ZM7 10L12 3L14 5L9 12H6ZM4 6H6",
  phone: "M5 1H12V15H5ZM5 4H12M8 12H9",
  profile: "M6 2H10V7H6ZM3 14V10L6 8H10L13 10V14Z",
  settings: "M2 4H14M2 12H14M5 2V6M11 10V14",
  nearby: "M3 5H13V13H3ZM1 5L8 1L15 5M6 13V8H10V13",
  saves: "M2 2H12L14 4V14H2ZM5 2V6H11V2M5 10H11V14",
  closet: "M3 2H13V14H3ZM8 2V14M6 8V10M10 8V10",
};
export const menuIcon = (id) =>
  `<svg viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges"><path d="${paths[id] || paths.profile}" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
