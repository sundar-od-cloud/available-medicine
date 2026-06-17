/** Fixed teal tab pinned to the right edge of the viewport. */
export function VerticalTab() {
  return (
    <button
      className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-3 bg-[var(--teal)] py-6 pl-3 pr-2 text-white shadow-lg transition-colors hover:bg-[var(--teal-dark)] lg:flex"
      type="button"
    >
      <span className="fx-vtab text-[11px] font-semibold uppercase tracking-[0.18em]">
        Workspaces Budget Calculation
      </span>
      <span className="mt-1 h-2 w-2 bg-white" />
    </button>
  );
}
