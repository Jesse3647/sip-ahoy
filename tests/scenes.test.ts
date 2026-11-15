import { describe, expect, it } from "vitest";
import { nextOpeningScene, sceneOpeningGap, scenes } from "../src/scenes";
describe("random scenes on eligible navigation/open checks", () => {
  it("contains six scenes and can randomly choose any on the first visit", () => {
    expect(scenes).toHaveLength(6);
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(6);
    for (let i = 0; i < 6; i++)
      expect(nextOpeningScene(null, 500, () => (i + 0.5) / 6)).toEqual({
        index: i,
        lastChanged: 500,
      });
  });
  it("frequent checks do not postpone the hour since the last actual change", () => {
    let state = { index: 2, lastChanged: 1000 };
    for (let i = 1; i < 60; i++) {
      state = nextOpeningScene(state, 1000 + i * 60000, () => 0);
      expect(state).toEqual({ index: 2, lastChanged: 1000 });
    }
    expect(nextOpeningScene(state, 1000 + sceneOpeningGap, () => 0)).toEqual({
      index: 3,
      lastChanged: 1000 + sceneOpeningGap,
    });
  });
  it("chooses among all five alternatives and never repeats the current scene", () => {
    for (let index = 0; index < 6; index++) {
      const choices = new Set<number>();
      for (let pick = 0; pick < 5; pick++) {
        const next = nextOpeningScene(
          { index, lastChanged: 1000 },
          1000 + sceneOpeningGap,
          () => (pick + 0.5) / 5,
        );
        expect(next.index).not.toBe(index);
        choices.add(next.index);
      }
      expect(choices.size).toBe(5);
    }
  });
  it("migrates the old opening timestamp and safely handles bad data or a backwards clock", () => {
    expect(nextOpeningScene({ index: 3, lastOpened: 1000 }, 1500)).toEqual({
      index: 3,
      lastChanged: 1000,
    });
    expect(nextOpeningScene({ index: 3, lastChanged: 1000 }, 500)).toEqual({
      index: 3,
      lastChanged: 500,
    });
    for (const value of [
      null,
      {},
      true,
      "bad",
      { index: 9, lastChanged: 1 },
      { index: 0, lastChanged: "bad" },
    ])
      expect(nextOpeningScene(value, 500, () => 0)).toEqual({
        index: 0,
        lastChanged: 500,
      });
  });
});
