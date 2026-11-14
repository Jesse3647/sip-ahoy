import { useId } from "react";
import type { CharacterId, CharacterMood } from "../characters";

type Eye = readonly [
  x: number,
  y: number,
  rx: number,
  ry: number,
  angle: number,
];
// Eye positions in a 384px expression cell. Already-winking eyes stay untouched.
const eyes: Record<CharacterId, Record<CharacterMood, readonly Eye[]>> = {
  skipper: {
    ready: [
      [160, 165, 26, 29, 5],
      [245, 161, 24, 29, -8],
    ],
    cheerful: [
      [156, 157, 26, 27, 14],
      [239, 145, 25, 27, -18],
    ],
    merry: [[234, 138, 25, 25, -20]],
    water: [
      [147, 170, 30, 29, -32],
      [221, 147, 29, 25, -5],
    ],
  },
  finn: {
    ready: [
      [145, 120, 20, 22, 9],
      [240, 122, 20, 23, -8],
    ],
    cheerful: [
      [143, 102, 20, 20, 28],
      [232, 118, 20, 22, -20],
    ],
    merry: [[154, 102, 21, 21, 15]],
    water: [
      [130, 141, 25, 23, -29],
      [215, 121, 28, 20, 9],
    ],
  },
  sunny: {
    ready: [
      [149, 145, 30, 31, 8],
      [255, 136, 27, 31, -14],
    ],
    cheerful: [
      [144, 130, 29, 29, 18],
      [245, 110, 26, 28, -20],
    ],
    merry: [[152, 140, 30, 29, 14]],
    water: [
      [139, 158, 31, 25, -32],
      [228, 122, 31, 22, 0],
    ],
  },
  pip: {
    ready: [
      [155, 146, 22, 22, 8],
      [257, 138, 18, 22, -14],
    ],
    cheerful: [
      [159, 137, 23, 21, 12],
      [256, 124, 18, 22, -18],
    ],
    merry: [[239, 114, 19, 21, -24]],
    water: [
      [156, 160, 25, 18, -30],
      [241, 127, 24, 18, -12],
    ],
  },
  clawdia: {
    ready: [
      [156, 174, 24, 25, -4],
      [244, 171, 24, 25, 7],
    ],
    cheerful: [
      [156, 163, 23, 22, 12],
      [240, 155, 23, 23, -10],
    ],
    merry: [[250, 147, 22, 23, -10]],
    water: [
      [151, 180, 30, 23, -27],
      [237, 155, 26, 19, 0],
    ],
  },
  pearl: {
    ready: [
      [179, 112, 24, 23, -7],
      [251, 102, 16, 23, -10],
    ],
    cheerful: [
      [175, 107, 24, 20, 4],
      [245, 93, 17, 23, -15],
    ],
    merry: [[259, 88, 19, 23, -20]],
    water: [
      [167, 128, 27, 22, -20],
      [239, 108, 23, 20, -16],
    ],
  },
};
const colors: Record<CharacterId, readonly [string, string, string]> = {
  skipper: ["#ff9a38", "#f58a29", "#61351f"],
  finn: ["#78c4e9", "#60b5e0", "#2c526b"],
  sunny: ["#adeb9f", "#93dc8e", "#455035"],
  pip: ["#f7ebd9", "#eddfc7", "#3e3630"],
  clawdia: ["#ff8d94", "#f77d86", "#69373e"],
  pearl: ["#ca94e8", "#bc81dd", "#563565"],
};

/** Only the eyelids change; the underlying pose and expression artwork never moves. */
export function SailorBlink({
  characterId,
  mood,
}: {
  characterId: CharacterId;
  mood: CharacterMood;
}) {
  const id = useId();
  const [light, shade, lash] = colors[characterId];
  return (
    <svg className="sailor-blink" viewBox="0 0 384 384" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={light} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
      </defs>
      {eyes[characterId][mood].map(([x, y, rx, ry, angle], index) => (
        <g key={index} transform={`translate(${x} ${y}) rotate(${angle})`}>
          <ellipse rx={rx} ry={ry} fill={`url(#${id})`} />
          <path
            d={`M ${-rx * 0.77} ${ry * 0.12} Q 0 ${ry * 0.7} ${rx * 0.77} ${ry * 0.12}`}
            fill="none"
            stroke={lash}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}
