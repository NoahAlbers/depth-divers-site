"use client";

import { useState, useMemo } from "react";
import {
  generateArrangements,
  SEAT_POSITIONS,
  type SeatingArrangement,
} from "@/lib/seating";
import { PLAYERS, getPlayerColor, getPlayerShort } from "@/lib/players";

function SeatMapCard({
  arrangement,
  expanded,
  onClick,
}: {
  arrangement: SeatingArrangement;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`card-glow rounded-lg border bg-surface p-3 text-left transition-all ${
        expanded
          ? "border-gold col-span-2 row-span-2 p-6 shadow-[0_0_30px_rgba(229,192,123,0.2)]"
          : "border-border"
      }`}
    >
      <div className="mb-2 text-center text-xs text-gray-500">
        #{arrangement.id + 1}
      </div>
      <div className="flex justify-center gap-4">
        {/* Left column: seats 3, 2, 1 */}
        <div className="flex flex-col gap-1">
          {[3, 2, 1].map((seat) => (
            <SeatSlot
              key={seat}
              seat={seat}
              player={arrangement.seats[seat]}
              expanded={expanded}
            />
          ))}
        </div>
        {/* Right column: seats 4, 5, 6 */}
        <div className="flex flex-col gap-1">
          {[4, 5, 6].map((seat) => (
            <SeatSlot
              key={seat}
              seat={seat}
              player={arrangement.seats[seat]}
              expanded={expanded}
            />
          ))}
        </div>
      </div>
      {/* DM indicator */}
      <div className="mt-2 text-center text-xs font-bold text-white">
        {expanded ? "DM (Noah)" : "DM"}
      </div>
    </button>
  );
}

function SeatSlot({
  seat,
  player,
  expanded,
}: {
  seat: number;
  player: string;
  expanded: boolean;
}) {
  const color = getPlayerColor(player);
  const label = expanded ? player : getPlayerShort(player);

  return (
    <div
      className={`rounded border px-2 py-1 text-center font-bold ${
        expanded ? "min-w-[90px] text-sm" : "min-w-[42px] text-[10px]"
      }`}
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}10`,
      }}
    >
      <span className="text-[8px] text-gray-500">{seat} </span>
      {label}
    </div>
  );
}

export default function SeatingPage() {
  const arrangements = useMemo(() => generateArrangements(), []);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterPlayer, setFilterPlayer] = useState<string | null>(null);
  const [filterSeat, setFilterSeat] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = arrangements;
    if (filterPlayer) {
      result = result.filter((a) => {
        if (filterSeat) {
          return a.seats[filterSeat] === filterPlayer;
        }
        return Object.values(a.seats).includes(filterPlayer);
      });
    } else if (filterSeat) {
      result = result;
    }
    return result;
  }, [arrangements, filterPlayer, filterSeat]);

  const handleRandomPick = () => {
    const source = filtered.length > 0 ? filtered : arrangements;
    const pick = source[Math.floor(Math.random() * source.length)];
    setExpandedId(pick.id);
  };

  return (
    <div>
      <h1 className="mb-2 font-cinzel text-3xl font-bold text-gold">
        Seating Arrangements
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        {filtered.length} valid arrangement{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleRandomPick}
          className="rounded bg-gold px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-[#f0d090]"
        >
          Random Pick
        </button>

        {/* Player filter */}
        <div className="flex flex-wrap gap-1">
          {PLAYERS.map((p) => (
            <button
              key={p.name}
              onClick={() =>
                setFilterPlayer(filterPlayer === p.name ? null : p.name)
              }
              className={`rounded px-2 py-1 text-xs font-bold transition-all ${
                filterPlayer === p.name ? "ring-2 ring-white/30" : "opacity-70 hover:opacity-100"
              }`}
              style={{
                color: p.color,
                backgroundColor:
                  filterPlayer === p.name ? `${p.color}25` : `${p.color}10`,
              }}
            >
              {p.name}
            </button>
          ))}
          {filterPlayer && (
            <button
              onClick={() => setFilterPlayer(null)}
              className="rounded px-2 py-1 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Seat filter */}
        {filterPlayer && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Seat:</span>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeat(filterSeat === s ? null : s)}
                className={`h-6 w-6 rounded text-xs font-bold transition-colors ${
                  filterSeat === s
                    ? "bg-gold text-background"
                    : "bg-surface-light text-gray-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arrangement grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((arr) => (
          <SeatMapCard
            key={arr.id}
            arrangement={arr}
            expanded={expandedId === arr.id}
            onClick={() =>
              setExpandedId(expandedId === arr.id ? null : arr.id)
            }
          />
        ))}
      </div>

      {/* Constraints reference */}
      <div className="mt-10 rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 font-cinzel text-sm font-bold text-gold">
          Seating Constraints
        </h3>
        <div className="grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
          <div>
            <span style={{ color: getPlayerColor("Johnathan") }} className="font-bold">
              Johnathan
            </span>
            : Seat 1 or 6 (closest to DM)
          </div>
          <div>
            <span style={{ color: getPlayerColor("Eric") }} className="font-bold">
              Eric
            </span>
            : Seat 3 or 4 (furthest from DM)
          </div>
          <div>
            <span style={{ color: getPlayerColor("Matthew") }} className="font-bold">
              Matthew
            </span>
            : Seat 1, 3, 4, or 6 (edges only)
          </div>
          <div>
            <span className="text-gray-300">Mykolov, Brent, Justin</span>: Any
            seat
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Layout (DM perspective): Left column seats 3-2-1, Right column seats
          4-5-6. Seats 1 & 6 closest to DM, seats 3 & 4 furthest.
        </div>
      </div>
    </div>
  );
}
