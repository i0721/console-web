/** Route destinations settle after navigation overlays release focus and scroll locking. */
let cancelPending: (() => void) | undefined;

export function focusRouteAnchor(href: string, resetScroll = false): void {
  const target = new URL(href, location.href);
  cancelPending?.();
  cancelPending = undefined;
  if (!target.hash && !resetScroll) return;
  let id: string;
  try {
    id = decodeURIComponent(target.hash.slice(1));
  } catch {
    // 外部书签可能带无效编码；定位失败不能阻断页面 hydration。
    return;
  }
  let frame = 0;
  const dispose = () => {
    observer.disconnect();
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    if (cancelPending === dispose) cancelPending = undefined;
  };
  const locate = () => {
    if (location.pathname !== target.pathname || location.search !== target.search) return;
    const anchor = document.getElementById(id || 'main-content');
    if (!anchor || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!target.hash) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        dispose();
        return;
      }
      anchor.scrollIntoView({ block: 'center', behavior: 'instant' });
      const control = anchor.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not(:disabled), [role="radio"], [role="switch"], button:not(:disabled)',
      );
      control?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      (control ?? anchor).focus({ preventScroll: true });
      dispose();
    });
  };
  const observer = new MutationObserver(locate);
  observer.observe(document.body, { childList: true, subtree: true });
  const timeout = setTimeout(dispose, 5000);
  cancelPending = dispose;
  locate();
}
