import {
  characters,
  moods,
  type CharacterId,
  type CharacterMood,
} from "../characters";

/** Displays one quadrant of a character's expression sheet; no image requests leave this app. */
export function CharacterPortrait({
  characterId,
  mood = "ready",
  decorative = false,
}: {
  characterId: CharacterId;
  mood?: CharacterMood;
  decorative?: boolean;
}) {
  const character = characters[characterId];
  return (
    <span
      className={`character-portrait emotion-${mood}`}
      data-character={characterId}
      data-mood={mood}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative ? undefined : `${character.name} · ${moods[mood].label}`
      }
      style={{
        backgroundImage: `url(/characters/${characterId}.png)`,
        backgroundPosition: moods[mood].position,
      }}
    >
      <span className="emotion-symbol" aria-hidden="true">
        {moods[mood].symbol}
      </span>
    </span>
  );
}
