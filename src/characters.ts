import type { Entry, Traveler } from "./model";

export const characterIds = [
  "skipper",
  "sunny",
  "pip",
  "finn",
  "clawdia",
  "pearl",
] as const;
export type CharacterId = (typeof characterIds)[number];
export const characters: Record<
  CharacterId,
  { name: string; species: string; color: string }
> = {
  skipper: { name: "Skipper", species: "Octopus captain", color: "#fff0dc" },
  sunny: { name: "Sunny", species: "Sea turtle", color: "#e0f5df" },
  pip: { name: "Pip", species: "Puffin", color: "#e5edff" },
  finn: { name: "Finn", species: "Dolphin", color: "#dff6fa" },
  clawdia: { name: "Clawdia", species: "Crab", color: "#ffe7ec" },
  pearl: { name: "Pearl", species: "Seahorse", color: "#eee5ff" },
};
export const moods = {
  ready: { label: "Ready to sail", position: "0% 0%", symbol: "✦" },
  cheerful: { label: "All smiles", position: "100% 0%", symbol: "♡" },
  merry: { label: "Feeling merry", position: "0% 100%", symbol: "✧" },
  water: { label: "Water break", position: "100% 100%", symbol: "💧" },
} as const;
export type CharacterMood = keyof typeof moods;

/** Older journals get a stable character without a data migration or an implicit save. */
export function characterFor(traveler?: Traveler): CharacterId {
  if (!traveler) return "skipper";
  if (traveler.characterId) return traveler.characterId;
  let hash = 0;
  for (const letter of traveler.id)
    hash = (hash * 31 + letter.charCodeAt(0)) >>> 0;
  return characterIds[hash % characterIds.length];
}

export const reactionWindowMs = 6 * 60 * 60 * 1000;

/** Live, cosmetic reactions only. Water changes this animation score, never an impairment estimate. */
export function sailorReaction(
  traveler: Traveler,
  entries: Entry[],
  now = Date.now(),
): { mood: CharacterMood; total: number; alcohol: number } {
  const recent = entries.filter((entry) => {
    const time = Date.parse(entry.time);
    return (
      entry.travelerId === traveler.id &&
      entry.sailingId === traveler.sailingId &&
      time > now - reactionWindowMs &&
      time <= now
    );
  });
  const alcohol = recent.filter((entry) =>
    ["Cocktail", "Beer", "Wine", "Spirit"].includes(entry.category),
  ).length;
  const waters = recent.filter((entry) => entry.category === "Water").length;
  const score = Math.max(0, alcohol - waters);
  return {
    total: recent.length,
    alcohol,
    mood: !recent.length
      ? "ready"
      : score >= 6
        ? "water"
        : score >= 3
          ? "merry"
          : "cheerful",
  };
}
