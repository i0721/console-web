/** Explicit field destinations are handled after the route and its overlay settle. */
let cancelPending: (() => void) | undefined;

export function focusRouteAnchor(href: string): void {
  const target = new URL(href, location.href);
  cancelPending?.();
  cancelPending = undefined;
  if (!target.hash) return;
  const id = decodeURIComponent(target.hash.slice(1));
  let frame = 0;
  const dispose = () => {
    observer.disconnect();
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    if (cancelPending === dispose) cancelPending = undefined;
  };
  const locate = () => {
    if (location.pathname !== target.pathname) return;
    const anchor = document.getElementById(id);
    if (!anchor || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
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
