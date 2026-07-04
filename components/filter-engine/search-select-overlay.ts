export const SEARCH_SELECT_OVERLAY_SELECTOR = ".proj-filter-select-overlay";

export function isInsideSearchSelectOverlay(target: Node | null | undefined): boolean {
  return target instanceof Element && !!target.closest(SEARCH_SELECT_OVERLAY_SELECTOR);
}
