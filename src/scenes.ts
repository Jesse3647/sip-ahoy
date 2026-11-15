export const scenes = [
  { id: "pool-deck", label: "Pool deck" },
  { id: "piano-lounge", label: "Piano lounge" },
  { id: "sunset-deck", label: "Sunset deck" },
  { id: "island-beach", label: "Island beach" },
  { id: "ship-promenade", label: "Ship promenade" },
  { id: "moonlit-deck", label: "Moonlit deck" },
] as const;
export type Scene = (typeof scenes)[number];
export const sceneStorageKey = "sipahoy-opening-scene";
export const sceneOpeningGap = 60 * 60 * 1000;
export type SceneOpening = { index: number; lastChanged: number };

/** A navigation/open check never postpones the next eligible scene change. */
export function nextOpeningScene(
  value: unknown,
  now: number,
  random = Math.random,
): SceneOpening {
  const previous = value as
    (Partial<SceneOpening> & { lastOpened?: number }) | null;
  const timestamp = previous?.lastChanged ?? previous?.lastOpened;
  if (
    !previous ||
    !Number.isInteger(previous.index) ||
    previous.index! < 0 ||
    previous.index! >= scenes.length ||
    !Number.isFinite(timestamp) ||
    timestamp! < 0
  ) {
    return { index: Math.floor(random() * scenes.length), lastChanged: now };
  }
  if (now - timestamp! >= sceneOpeningGap) {
    // Pick uniformly from every scene except the current one.
    const offset = 1 + Math.floor(random() * (scenes.length - 1));
    return {
      index: (previous.index! + offset) % scenes.length,
      lastChanged: now,
    };
  }
  return { index: previous.index!, lastChanged: Math.min(timestamp!, now) };
}
