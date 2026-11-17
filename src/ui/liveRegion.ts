/** Visually hidden polite live region for screen reader announcements. */
export interface LiveRegion {
  announce(text: string): void;
  destroy(): void;
}

export function createLiveRegion(parent: HTMLElement = document.body): LiveRegion {
  const node = document.createElement('div');
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('aria-atomic', 'true');
  node.style.cssText =
    'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
  parent.appendChild(node);
  return {
    announce(text: string): void {
      // Clear first so repeating the same text is announced again.
      node.textContent = '';
      node.textContent = text;
    },
    destroy(): void {
      node.remove();
    },
  };
}
