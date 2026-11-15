import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import type { Sailing } from "../model";
import { ModalShell } from "./ui";
import { ShipArtwork, ShipArtworkCredit } from "./ShipArtwork";

const fullDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function SailingPicker({
  sailing,
  sailings,
  busy,
  error,
  onSelect,
  onNew,
  open,
  setOpen,
  onDelete,
}: {
  sailing: Sailing;
  sailings: Sailing[];
  busy: boolean;
  error: string;
  onSelect: (id: string) => Promise<boolean>;
  onNew: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  return (
    <>
      <div className="sailing-switch">
        <button
          className="sailing-picker-trigger"
          aria-label={`Change sailing: ${sailing.name}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={busy}
          onClick={() => setOpen(true)}
        >
          <ShipArtwork ship={sailing.ship} />
          <span className="sailing-picker-copy">
            <span className="sailing-picker-label">YOUR SAILING</span>
            <strong>{sailing.name}</strong>
            <span>{sailing.ship}</span>
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <button
          className="sailing-add"
          aria-label="New sailing"
          onClick={onNew}
          disabled={busy}
        >
          <Plus size={20} />
          <span className="new-sailing-label">New sailing</span>
        </button>
      </div>
      {open && (
        <ModalShell
          title="Your sailings"
          className="sailing-picker-modal"
          onClose={() => {
            if (!busy) setOpen(false);
          }}
        >
          <p className="sailing-picker-intro">
            Each sailing is a saved session with its own sailors and drink logs.
            Open a previous trip or start a fresh one; your other sailings stay
            saved.
          </p>
          {error && (
            <div className="banner error" role="alert">
              {error}
            </div>
          )}
          <div className="sailing-options">
            {sailings.map((trip) => (
              <div key={trip.id} className="sailing-option-group">
                <button
                  className="sailing-option"
                  aria-label={`Select ${trip.name}`}
                  aria-pressed={trip.id === sailing.id}
                  disabled={busy}
                  onClick={async () => {
                    if (trip.id === sailing.id || (await onSelect(trip.id)))
                      setOpen(false);
                  }}
                >
                  <ShipArtwork ship={trip.ship} />
                  <span className="sailing-option-copy">
                    <span className="sailing-option-ship">{trip.ship}</span>
                    <strong>{trip.name}</strong>
                    <span className="sailing-option-dates">
                      {fullDate(trip.start)} – {fullDate(trip.end)}
                    </span>
                    {trip.id === sailing.id && (
                      <span className="sailing-selected">
                        <Check size={14} /> Current sailing
                      </span>
                    )}
                  </span>
                </button>
                <button
                  className="sailing-delete"
                  aria-label={`Delete ${trip.name}`}
                  disabled={busy}
                  onClick={() => onDelete(trip.id)}
                >
                  <Trash2 size={16} /> Delete sailing
                </button>
              </div>
            ))}
          </div>
          <button
            className="button primary full sailing-picker-create"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              onNew();
            }}
          >
            <Plus size={18} /> Plan a new sailing
          </button>
          <ShipArtworkCredit />
        </ModalShell>
      )}
    </>
  );
}
