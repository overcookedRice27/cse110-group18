export type GateType = "AND" | "OR" | "NOT" | "XOR";

// Coordinates are grid cells, not pixels. Gates occupy more than one cell.
export type LevelPiece =
    | {
          type: "gate";
          gateType: GateType;
          fixed?: boolean;
          x: number;
          y: number;
      }
    | { type: "wire"; fixed?: boolean; x: number; y: number }
    | { type: "input"; on: boolean; x: number; y: number }
    | { type: "exit"; x: number; y: number }
    | { type: "block"; x: number; y: number };

// This is the JSON format used when importing and exporting a level.
export type LevelData = {
    id: number;
    pieces: LevelPiece[];
};
