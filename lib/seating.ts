export interface SeatingArrangement {
  id: number;
  seats: Record<number, string>; // seat number (1-6) -> player name
}

// Seat layout from DM perspective:
// 3  4
// 2  5
// 1  6
//  DM

// Constraints:
// Jonathan: seat 1 or 6 (closest to DM)
// Eric: seat 3 or 4 (furthest from DM)
// Matthew: seat 1, 3, 4, or 6 (edges only)
// Mykolov, Brent, Justin: any remaining seat

const JOHNATHAN_SEATS = [1, 6];
const ERIC_SEATS = [3, 4];
const MATTHEW_SEATS = [1, 3, 4, 6];
const FREE_PLAYERS = ["Mykolov", "Brent", "Justin"];

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

export function generateArrangements(): SeatingArrangement[] {
  const arrangements: SeatingArrangement[] = [];
  let id = 0;

  for (const jSeat of JOHNATHAN_SEATS) {
    for (const eSeat of ERIC_SEATS) {
      // Matthew: edges (1, 3, 4, 6) minus seats taken by Jonathan and Eric
      const matthewOptions = MATTHEW_SEATS.filter(
        (s) => s !== jSeat && s !== eSeat
      );

      for (const mSeat of matthewOptions) {
        // Remaining seats for free players
        const allSeats = [1, 2, 3, 4, 5, 6];
        const takenSeats = [jSeat, eSeat, mSeat];
        const remainingSeats = allSeats.filter((s) => !takenSeats.includes(s));

        // All permutations of free players in remaining seats
        for (const perm of permutations(FREE_PLAYERS)) {
          const seats: Record<number, string> = {
            [jSeat]: "Jonathan",
            [eSeat]: "Eric",
            [mSeat]: "Matthew",
          };
          perm.forEach((player, i) => {
            seats[remainingSeats[i]] = player;
          });

          arrangements.push({ id: id++, seats });
        }
      }
    }
  }

  return arrangements;
}

export const SEAT_POSITIONS: Record<
  number,
  { side: "left" | "right"; row: number; label: string }
> = {
  3: { side: "left", row: 0, label: "Far Left" },
  2: { side: "left", row: 1, label: "Mid Left" },
  1: { side: "left", row: 2, label: "Near Left" },
  4: { side: "right", row: 0, label: "Far Right" },
  5: { side: "right", row: 1, label: "Mid Right" },
  6: { side: "right", row: 2, label: "Near Right" },
};
