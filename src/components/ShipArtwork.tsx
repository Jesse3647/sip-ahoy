import { useState } from "react";
import { Ship } from "lucide-react";
import artwork from "../data/ship-artwork.json";

/** Locally cached official artwork, with a neutral fallback for imported ships. */
export function ShipArtwork({
  ship,
  className = "",
}: {
  ship: string;
  className?: string;
}) {
  const art = (artwork as Record<string, { file: string }>)[ship];
  const [failedSource, setFailedSource] = useState("");
  const src = art ? `${import.meta.env.BASE_URL}ships/${art.file}` : "";
  return (
    <span className={`ship-artwork ${className}`}>
      {src && failedSource !== src ? (
        <img
          src={src}
          alt={`${ship} — official ship artwork`}
          onError={() => setFailedSource(src)}
        />
      ) : (
        <Ship aria-label={ship} size={44} />
      )}
    </span>
  );
}

export function ShipArtworkCredit() {
  return (
    <a
      className="ship-artwork-credit"
      href="https://www.royalcaribbean.com/cruise-ships"
      target="_blank"
      rel="noreferrer"
    >
      Ship photography & renderings © Royal Caribbean
    </a>
  );
}
