import { useLayoutEffect, useRef, useState } from "react";
import {
  nextOpeningScene,
  scenes,
  sceneStorageKey,
  type SceneOpening,
} from "./scenes";

/** Navigation, opening and resuming check the hour since the last actual change. */
export function useOpeningScene(navigationKey: string) {
  const [index, setIndex] = useState(0);
  const fallback = useRef<SceneOpening | null>(null);
  useLayoutEffect(() => {
    const opened = () => {
      let previous: unknown = fallback.current;
      try {
        if (!previous)
          previous = JSON.parse(
            localStorage.getItem(sceneStorageKey) ?? "null",
          );
      } catch {
        /* Use this visit's state if storage is unavailable. */
      }
      const next = nextOpeningScene(previous, Date.now());
      fallback.current = next;
      try {
        localStorage.setItem(sceneStorageKey, JSON.stringify(next));
      } catch {
        /* Cosmetic preferences must not prevent opening the journal. */
      }
      setIndex(next.index);
    };
    opened();
    const visible = () => {
      if (!document.hidden) opened();
    };
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) visible();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pageshow", restored);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pageshow", restored);
    };
  }, [navigationKey]);
  return scenes[index];
}
