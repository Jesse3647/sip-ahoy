import type { Entry, Sailing, Traveler } from "../model";
import { characterFor, characters, moods, sailorReaction } from "../characters";
import { CharacterPortrait } from "./CharacterPortrait";

/** One sailing day drives every sailor's character; users can inspect earlier days explicitly. */
export function ReactionDay({
  sailing,
  day,
  onChange,
}: {
  sailing: Sailing;
  day: string;
  onChange: (day: string) => void;
}) {
  return (
    <label className="reaction-day">
      <span>Character day</span>
      <input
        aria-label="Character day"
        type="date"
        value={day}
        min={sailing.start}
        max={sailing.end}
        onChange={(event) => {
          const value = event.target.value;
          if (value >= sailing.start && value <= sailing.end) onChange(value);
        }}
      />
    </label>
  );
}

/** Selects a sailor for the hero and exposes character assignment through the existing editor. */
export function CrewReactions({
  crew,
  entries,
  sailing,
  day,
  onDay,
  selectedId,
  onSelect,
  onEdit,
}: {
  crew: Traveler[];
  entries: Entry[];
  sailing: Sailing;
  day: string;
  onDay: (day: string) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  onEdit: () => void;
}) {
  if (!crew.length) return null;
  return (
    <section className="card crew-reactions" aria-label="Sailor characters">
      <div className="reaction-heading">
        <h2>Your sailors</h2>
        <ReactionDay sailing={sailing} day={day} onChange={onDay} />
      </div>
      <div className="sailor-strip">
        {crew.map((traveler) => {
          const id = characterFor(traveler);
          const reaction = sailorReaction(traveler, entries, day);
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
        <p>Playful daily reactions, not an intoxication estimate.</p>
        <button className="plain" onClick={onEdit}>
          Change character
        </button>
      </div>
    </section>
  );
}
