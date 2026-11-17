const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (n) => !n.hasAttribute('hidden') && n.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Wraps Tab and Shift+Tab inside `container`. Returns a release function.
 * With no focusable children, Tab is swallowed so focus cannot escape.
 */
export function trapFocus(container: HTMLElement): () => void {
  const handler = (ev: KeyboardEvent): void => {
    if (ev.key !== 'Tab') return;
    const items = focusableIn(container);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      ev.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (ev.shiftKey && (active === first || !container.contains(active))) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && (active === last || !container.contains(active))) {
      ev.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}
