import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type RefObject,
} from "react";

/** Pointer-driven sheet motion is restricted to the handle, so menu scrolling remains native. */
export function useMobileSheet(
  ref: RefObject<HTMLDialogElement | null>,
  onClose: () => void,
) {
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState<number>();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  const finishClose = () => {
    if (!closingRef.current) return;
    closingRef.current = false;
    window.clearTimeout(closeTimer.current);
    closeCallback.current();
  };
  const slideClosed = (sheetHeight: number) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setDragging(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }
    setClosing(true);
    setHeight(sheetHeight);
    setOffset(sheetHeight + 32);
    // Fallback also handles interrupted transitions and preference changes mid-exit.
    closeTimer.current = window.setTimeout(finishClose, 300);
  };
  const compactHeight = useRef<number | undefined>(undefined);
  const gesture = useRef<{
    id: number;
    startY: number;
    startX: number;
    startHeight: number;
    compact: number;
    max: number;
    expanded: boolean;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const mobile = () => window.matchMedia("(max-width: 700px)").matches;
  const limits = () => {
    const dialog = ref.current!;
    const compact =
      compactHeight.current ?? dialog.getBoundingClientRect().height;
    compactHeight.current = compact;
    const max = Math.max(
      compact,
      Math.min(
        window.visualViewport?.height ?? window.innerHeight,
        parseFloat(getComputedStyle(dialog).maxHeight),
      ),
    );
    return { compact, max };
  };
  useEffect(() => {
    const reset = () => {
      if (closingRef.current) return;
      gesture.current = null;
      compactHeight.current = undefined;
      setExpanded(false);
      setHeight(undefined);
      setOffset(0);
      setDragging(false);
    };
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);
  const snap = (next: boolean, compact: number, max: number) => {
    const canExpand = next && max > compact + 1;
    setExpanded(canExpand);
    setHeight(canExpand ? max : compact);
    setOffset(0);
    setDragging(false);
  };
  const toggle = (next = !expanded) => {
    if (!mobile() || !ref.current || closingRef.current) return;
    const { compact, max } = limits();
    snap(next, compact, max);
  };
  const end = (event: PointerEvent<HTMLButtonElement>, cancel = false) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    gesture.current = null;
    suppressClick.current = current.moved;
    const distance = current.startY - event.clientY;
    // Dismissal depends on distance, never flick speed. Small pulls return to their starting size.
    const up = distance > 52;
    const crossedThreshold = -distance >= current.startHeight / 3;
    if (!cancel && crossedThreshold) {
      slideClosed(current.startHeight);
    } else {
      snap(
        cancel ? current.expanded : up ? true : current.expanded,
        current.compact,
        current.max,
      );
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  return {
    expanded,
    dragging,
    closing,
    onTransitionEnd(event: React.TransitionEvent<HTMLDialogElement>) {
      if (
        event.target === event.currentTarget &&
        event.propertyName === "transform"
      )
        finishClose();
    },
    style: {
      "--sheet-height": height === undefined ? "auto" : `${height}px`,
      "--sheet-offset": `${offset}px`,
    } as CSSProperties,
    handleProps: {
      onPointerDown(event: PointerEvent<HTMLButtonElement>) {
        if (
          !mobile() ||
          !ref.current ||
          closingRef.current ||
          !event.isPrimary ||
          event.button !== 0
        )
          return;
        const { compact, max } = limits();
        suppressClick.current = false;
        gesture.current = {
          id: event.pointerId,
          startY: event.clientY,
          startX: event.clientX,
          startHeight: ref.current.getBoundingClientRect().height,
          compact,
          max,
          expanded,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      },
      onPointerMove(event: PointerEvent<HTMLButtonElement>) {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        current.moved ||=
          Math.hypot(
            event.clientY - current.startY,
            event.clientX - current.startX,
          ) > 6;
        const downward = event.clientY - current.startY;
        // Downward drags move the whole sheet, including when it starts expanded.
        setHeight(
          downward > 0
            ? current.startHeight
            : Math.min(current.max, current.startHeight - downward),
        );
        setOffset(Math.max(0, downward));
      },
      onPointerUp(event: PointerEvent<HTMLButtonElement>) {
        end(event);
      },
      onPointerCancel(event: PointerEvent<HTMLButtonElement>) {
        end(event, true);
      },
      onLostPointerCapture(event: PointerEvent<HTMLButtonElement>) {
        end(event, true);
      },
      onClick() {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        toggle();
      },
      onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          toggle(event.key === "ArrowUp");
        }
      },
    },
  };
}
