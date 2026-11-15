import { useLayoutEffect, useRef, useState } from "react";
import {
  nextOpeningScene,
  scenes,
  sceneStorageKey,
  type SceneOpening,
} from "./scenes";

/** Opening/resuming can change the backdrop; time passing while visible never does. */
export function useOpeningScene() {
  const [index, setIndex] = useState(0);
  const started = useRef(false);
  const fallback = useRef<SceneOpening | null>(null);
  useLayoutEffect(() => {
    const opened = () => {
      let previous: unknown = fallback.current;
      try {
        previous = JSON.parse(localStorage.getItem(sceneStorageKey) ?? "null");
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
    if (!started.current) {
      started.current = true;
      opened();
    }
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
  }, []);
  return scenes[index];
}
