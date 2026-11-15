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
export type SceneOpening = { index: number; lastOpened: number };

export function nextOpeningScene(value: unknown, now: number): SceneOpening {
  const previous = value as Partial<SceneOpening> | null;
  if (
    !previous ||
    !Number.isInteger(previous.index) ||
    previous.index! < 0 ||
    previous.index! >= scenes.length ||
    !Number.isFinite(previous.lastOpened) ||
    previous.lastOpened! < 0
  ) {
    return { index: 0, lastOpened: now };
  }
  return {
    index:
      now - previous.lastOpened! >= sceneOpeningGap
        ? (previous.index! + 1) % scenes.length
        : previous.index!,
    lastOpened: now,
  };
}
