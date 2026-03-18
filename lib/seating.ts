export interface SeatingArrangement {
  id: number;
  seats: Record<number, string | null>; // seat number (1-6) -> player name or null (empty)
}

// Seat layout from DM perspective:
// 3  4
// 2  5
// 1  6
//  DM

// Constraints:
// Eric: seat 3 or 4 (furthest from DM)
// Matthew: seat 1, 3, 4, or 6 (edges only)
// Mykolov, Brent, Justin: any remaining seat
// 5 players, 6 seats — one seat is empty

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
  const allSeats = [1, 2, 3, 4, 5, 6];

  for (const eSeat of ERIC_SEATS) {
    // Matthew: edges minus Eric's seat
    const matthewOptions = MATTHEW_SEATS.filter((s) => s !== eSeat);

    for (const mSeat of matthewOptions) {
      // Remaining seats for free players (3 players pick 3 of the 4 remaining seats)
      const remainingSeats = allSeats.filter(
        (s) => s !== eSeat && s !== mSeat
      );

      // Choose which seat is empty (each of the 4 remaining seats can be empty)
      for (let emptyIdx = 0; emptyIdx < remainingSeats.length; emptyIdx++) {
        const emptySeat = remainingSeats[emptyIdx];
        const playerSeats = remainingSeats.filter((s) => s !== emptySeat);

        // All permutations of free players in the 3 player seats
        for (const perm of permutations(FREE_PLAYERS)) {
          const seats: Record<number, string | null> = {};
          allSeats.forEach((s) => (seats[s] = null));
          seats[eSeat] = "Eric";
          seats[mSeat] = "Matthew";
          perm.forEach((player, i) => {
            seats[playerSeats[i]] = player;
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
