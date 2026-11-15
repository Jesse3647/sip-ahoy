import { describe, expect, it } from "vitest";
import { nextOpeningScene, sceneOpeningGap, scenes } from "../src/scenes";
describe("background changes on qualifying opens", () => {
  it("has six different backdrops", () => {
    expect(scenes).toHaveLength(6);
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(6);
  });
  it("keeps the scene on a quick reopen and updates the opening time", () => {
    expect(
      nextOpeningScene(
        { index: 2, lastOpened: 1000 },
        1000 + sceneOpeningGap - 1,
      ),
    ).toEqual({ index: 2, lastOpened: 1000 + sceneOpeningGap - 1 });
  });
  it("advances exactly once at an hour or after a long absence, then wraps", () => {
    expect(
      nextOpeningScene({ index: 2, lastOpened: 1000 }, 1000 + sceneOpeningGap)
        .index,
    ).toBe(3);
    expect(
      nextOpeningScene(
        { index: 5, lastOpened: 1000 },
        1000 + 30 * sceneOpeningGap,
      ).index,
    ).toBe(0);
  });
  it("safely defaults when preferences are missing or corrupt, and handles a clock moving backwards", () => {
    for (const value of [
      null,
      {},
      true,
      "bad",
      { index: 9, lastOpened: 1 },
      { index: 0, lastOpened: "bad" },
    ])
      expect(nextOpeningScene(value, 500)).toEqual({
        index: 0,
        lastOpened: 500,
      });
    expect(nextOpeningScene({ index: 3, lastOpened: 1000 }, 500)).toEqual({
      index: 3,
      lastOpened: 500,
    });
  });
});
