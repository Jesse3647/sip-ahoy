import { useEffect, type CSSProperties } from "react";
import { X } from "lucide-react";
import { moods, type CharacterId, type CharacterMood } from "../characters";
import { CharacterPortrait } from "./CharacterPortrait";

/** A successful new serving's feedback; callers must wait for persistence before mounting. */
export function SaveCelebration({
  name,
  characterId,
  mood,
  travelerName,
  onClose,
}: {
  name: string;
  characterId: CharacterId;
  mood: CharacterMood;
  travelerName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [onClose]);
  return (
    <div
      className={`save-celebration ${mood === "water" ? "water-break" : ""}`}
    >
      <div className="celebration-particles" aria-hidden="true">
        {Array.from({ length: 26 }, (_, i) => (
          <i
            className={i % 3 === 0 ? "bubble" : "confetti"}
            key={i}
            style={
              {
                "--x": `${Math.cos(i * 2.4) * (90 + (i % 6) * 35)}px`,
                "--y": `${-140 - (i % 7) * 40}px`,
                "--spin": `${i * 71}deg`,
                "--delay": `${(i % 5) * 35}ms`,
                "--particle-color": [
                  "#3156f5",
                  "#ff8549",
                  "#f8d55e",
                  "#38cfcc",
                  "#ba9dff",
                ][i % 5],
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="celebration-card">
        <CharacterPortrait characterId={characterId} mood={mood} decorative />
        <div role="status" aria-live="polite">
          <strong>Drink saved!</strong>
          <span>{name}</span>
          <small>
            {travelerName} · {moods[mood].label}
          </small>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Dismiss celebration"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
