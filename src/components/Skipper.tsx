import { useEffect, useRef, useState } from "react";
import {
  characters,
  characterIds,
  moods,
  type CharacterId,
  type CharacterMood,
} from "../characters";
import { CharacterPortrait } from "./CharacterPortrait";

/** Interactive welcome mascot; optional cycling never changes the saved journal. */
export function Skipper({
  characterId = "skipper",
  mood = "ready",
  travelerName,
  cycleCharacters = false,
}: {
  characterId?: CharacterId;
  mood?: CharacterMood;
  travelerName?: string;
  cycleCharacters?: boolean;
}) {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const displayedId = cycleCharacters ? characterIds[cycleIndex] : characterId;
  const character = characters[displayedId];
  useEffect(() => {
    if (!greeting) return;
    const timer = window.setTimeout(() => setGreeting(false), 2600);
    return () => window.clearTimeout(timer);
  }, [greeting]);
  useEffect(() => {
    if (!cycleCharacters) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let interval: number | undefined;
    let swap: number | undefined;
    const update = () => {
      window.clearInterval(interval);
      window.clearTimeout(swap);
      setFading(false);
      if (!inView || document.hidden || motion.matches) return;
      interval = window.setInterval(() => {
        setFading(true);
        swap = window.setTimeout(() => {
          setCycleIndex((index) => (index + 1) % characterIds.length);
          setGreeting(false);
          setFading(false);
        }, 250);
      }, 3000);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    if (button.current) observer.observe(button.current);
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      window.clearInterval(interval);
      window.clearTimeout(swap);
    };
  }, [cycleCharacters]);
  return (
    <button
      ref={button}
      className={`skipper ${cycleCharacters ? "cycling" : ""} ${fading ? "is-fading" : ""} ${greeting ? "is-waving" : ""}`}
      aria-label={`Say ahoy to ${character.name}`}
      onClick={() => setGreeting((value) => !value)}
    >
      <span className="mascot-orbit" aria-hidden="true" />
      <span className="mascot-spark spark-one" aria-hidden="true">
        ✦
      </span>
      <span className="mascot-spark spark-two" aria-hidden="true">
        ✧
      </span>
      <CharacterPortrait
        key={`${mood}-${greeting}`}
        characterId={displayedId}
        mood={greeting && mood !== "water" ? "merry" : mood}
      />
      <span className="mascot-name" aria-hidden="true">
        {greeting
          ? "Ahoy, friend!"
          : travelerName
            ? `${travelerName} · ${moods[mood].label}`
            : `Meet ${character.name}`}
      </span>
    </button>
  );
}
