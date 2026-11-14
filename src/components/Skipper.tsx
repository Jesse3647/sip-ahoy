import { useEffect, useState } from "react";
import {
  characters,
  moods,
  type CharacterId,
  type CharacterMood,
} from "../characters";
import { CharacterPortrait } from "./CharacterPortrait";

/** Interactive mascot; greeting is local UI state and never changes the journal. */
export function Skipper({
  characterId = "skipper",
  mood = "ready",
  travelerName,
}: {
  characterId?: CharacterId;
  mood?: CharacterMood;
  travelerName?: string;
}) {
  const character = characters[characterId];
  const [greeting, setGreeting] = useState(false);
  useEffect(() => {
    if (!greeting) return;
    const timer = window.setTimeout(() => setGreeting(false), 2600);
    return () => window.clearTimeout(timer);
  }, [greeting]);
  return (
    <button
      className={`skipper ${greeting ? "is-waving" : ""}`}
      aria-label={`Say ahoy to ${character.name}`}
      onClick={() => setGreeting((v) => !v)}
    >
      <span className="mascot-orbit" aria-hidden="true" />
      <span className="mascot-spark spark-one" aria-hidden="true">
        ✦
      </span>
      <span className="mascot-spark spark-two" aria-hidden="true">
        ✧
      </span>
      <CharacterPortrait
        key={`${characterId}-${mood}-${greeting}`}
        characterId={characterId}
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
