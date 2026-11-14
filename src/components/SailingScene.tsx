import { useEffect, useRef, useState, type CSSProperties } from "react";
import { characterFor, moods, sailorReaction } from "../characters";
import type { Entry, Traveler } from "../model";
import { CharacterPortrait } from "./CharacterPortrait";
import { SailorBlink } from "./SailorBlink";

/** A quiet close-up, with no controls or scene changes. Crew selection lives below the banner. */
export function SailingScene({
  crew,
  entries,
  day,
  selectedId,
}: {
  crew: Traveler[];
  entries: Entry[];
  day: string;
  selectedId?: string;
}) {
  const [active, setActive] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const selected = crew.find((sailor) => sailor.id === selectedId) ?? crew[0];
  // Keep faces large, even on phones. The selected sailor always stays in the close-up.
  const visibleCrew = selected
    ? [selected, ...crew.filter((sailor) => sailor.id !== selected.id)].slice(
        0,
        2,
      )
    : [];
  useEffect(() => {
    let inView = false;
    const update = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    if (stage.current) observer.observe(stage.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div
      className="sailing-scene"
      ref={stage}
      data-active={active}
      aria-label="Your sailors by the pool"
    >
      <img className="scene-backdrop" src="/scenes/pool-deck.jpg" alt="" />
      <div className="portrait-crew" data-count={visibleCrew.length}>
        {visibleCrew.map((sailor, index) => {
          const { mood } = sailorReaction(sailor, entries, day);
          const characterId = characterFor(sailor);
          return (
            <figure
              className="sailor-closeup"
              key={sailor.id}
              data-selected={sailor.id === selected?.id}
              style={
                {
                  "--blink-delay": `${index * -3.7}s`,
                  "--blink-duration": `${7.4 + index * 1.9}s`,
                } as CSSProperties
              }
            >
              <div className="sailor-crop">
                <div className="sailor-face">
                  <CharacterPortrait
                    characterId={characterId}
                    mood={mood}
                    decorative
                  />
                  <SailorBlink characterId={characterId} mood={mood} />
                </div>
              </div>
              <figcaption>
                <strong>{sailor.name}</strong>
                <span>{moods[mood].label}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
