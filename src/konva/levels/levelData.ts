export type GateType = "AND" | "OR" | "NOT" | "XOR";
export type GateRequirements = Partial<Record<GateType, number>>;

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
    // Constant source types encode the signal value and need only a position.
    | { type: "high"; x: number; y: number }
    | { type: "low"; x: number; y: number }
    | { type: "exit"; x: number; y: number }
    | { type: "block"; x: number; y: number };

// This is the JSON format used when importing and exporting a level.
export type LevelData = {
    id: number;
    pieces: LevelPiece[];
    // Minimum number of each gate type connected upstream of an exit.
    requiredGates?: GateRequirements;
};
