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

/** Cosmetic reactions only. Counts are per sailor, sailing, and selected calendar day, never an impairment estimate. */
export function sailorReaction(
  traveler: Traveler,
  entries: Entry[],
  day: string,
): { mood: CharacterMood; total: number; alcohol: number } {
  const daily = entries.filter(
    (entry) =>
      entry.travelerId === traveler.id &&
      entry.sailingId === traveler.sailingId &&
      entry.sailingDate === day,
  );
  const alcohol = daily.filter((entry) =>
    ["Cocktail", "Beer", "Wine", "Spirit"].includes(entry.category),
  ).length;
  return {
    total: daily.length,
    alcohol,
    mood:
      alcohol >= 5
        ? "water"
        : alcohol >= 3
          ? "merry"
          : daily.length
            ? "cheerful"
            : "ready",
  };
}
