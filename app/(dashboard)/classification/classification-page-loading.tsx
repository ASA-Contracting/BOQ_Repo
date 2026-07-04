export function ClassificationPageLoading() {
  return (
    <div className="cls-workspace mc-root" data-theme="light">
      <div className="mc-dual-shell">
        <aside className="mc-dual-shell__sidebar mc-side-card mc-side-card--tree" aria-label="Category hierarchy">
          <div className="mc-tree-pane">
            <div className="mc-tree-empty">
              <span>Loading categories…</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
