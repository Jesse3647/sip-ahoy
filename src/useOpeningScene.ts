import { useLayoutEffect, useRef, useState } from "react";
import { nextOpeningScene, scenes, type SceneOpening } from "./scenes";

/** Scenes are session-only: new sailings change immediately, navigation/resume
 * changes after an hour, and a fresh launch starts a fresh random selection. */
export function useOpeningScene(
  navigationKey: string,
  sailingId: string | null,
) {
  const [index, setIndex] = useState(0);
  const current = useRef<SceneOpening | null>(null);
  const previousSailing = useRef<string | null | undefined>(undefined);
  useLayoutEffect(() => {
    const changedSailing =
      previousSailing.current != null && previousSailing.current !== sailingId;
    previousSailing.current = sailingId;
    const check = (force = false) => {
      const next = nextOpeningScene(
        current.current,
        Date.now(),
        Math.random,
        force,
      );
      current.current = next;
      setIndex(next.index);
    };
    check(changedSailing);
    const visible = () => {
      if (!document.hidden) check();
    };
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) visible();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    window.addEventListener("pageshow", restored);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", visible);
      window.removeEventListener("pageshow", restored);
    };
  }, [navigationKey, sailingId]);
  return scenes[index];
}
