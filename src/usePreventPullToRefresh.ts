import { useEffect } from "react";
import { isIOS } from "./useInstallApp";

/** Safari can ignore overscroll-behavior on the viewport. Cancel only a downward
 * single-finger pull with no scrollable content above it; keep scrolling and zoom. */
export function usePreventPullToRefresh() {
  useEffect(() => {
    if (!isIOS()) return;
    let gesture: { x: number; y: number; target: Element } | null = null;
    const start = (event: TouchEvent) => {
      gesture =
        event.touches.length === 1 && event.target instanceof Element
          ? {
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
              target: event.target,
            }
          : null;
    };
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        gesture = null;
        return;
      }
      if (!gesture) return;
      const touch = event.touches[0];
      const dy = touch.clientY - gesture.y;
      const dx = touch.clientX - gesture.x;
      gesture.x = touch.clientX;
      gesture.y = touch.clientY;
      if (dy <= 0 || Math.abs(dx) > dy) return;
      const dialog = gesture.target.closest("dialog[open]");
      for (let el: Element | null = gesture.target; el; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (
          /(auto|scroll)/.test(style.overflowY) &&
          el.scrollHeight > el.clientHeight
        ) {
          if (el.scrollTop > 0) return;
          // A contained scroller must not hand its gesture to the viewport.
          if (style.overscrollBehaviorY !== "auto") break;
        }
        if (el === dialog) break;
      }
      if (!dialog && (document.scrollingElement?.scrollTop ?? 0) > 0) return;
      if (event.cancelable) event.preventDefault();
    };
    const end = () => {
      gesture = null;
    };
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", end);
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
    };
  }, []);
}
