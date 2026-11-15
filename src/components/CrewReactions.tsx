import type { Entry, Traveler } from "../model";
import { characterFor, characters, moods, sailorReaction } from "../characters";
import { CharacterPortrait } from "./CharacterPortrait";

/** Selects a sailor for the hero and exposes character assignment through the existing editor. */
export function CrewReactions({
  crew,
  entries,
  now,
  selectedId,
  onSelect,
  onEdit,
}: {
  crew: Traveler[];
  entries: Entry[];
  now: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  onEdit: () => void;
}) {
  if (!crew.length) return null;
  return (
    <section className="card crew-reactions" aria-label="Sailor characters">
      <div className="reaction-heading">
        <h2>Your sailors</h2>
        <span className="footnote">Last 6 hours</span>
      </div>
      <div className="sailor-strip">
        {crew.map((traveler) => {
          const id = characterFor(traveler);
          const reaction = sailorReaction(traveler, entries, now);
          return (
            <button
              className="sailor-reaction"
              key={traveler.id}
              aria-label={`Show ${traveler.name}'s character`}
              aria-pressed={selectedId === traveler.id}
              onClick={() => onSelect(traveler.id)}
              style={{ background: characters[id].color }}
            >
              <CharacterPortrait
                key={`${id}-${reaction.mood}`}
                characterId={id}
                mood={reaction.mood}
              />
              <strong>{traveler.name}</strong>
              <span>{moods[reaction.mood].label}</span>
              <small>
                {reaction.total} logged · {reaction.alcohol} alcohol
              </small>
            </button>
          );
        })}
      </div>
      <div className="reaction-footer">
        <button className="plain" onClick={onEdit}>
          Change character
        </button>
      </div>
    </section>
  );
}
