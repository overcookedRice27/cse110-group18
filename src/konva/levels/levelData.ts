export type GateType = "AND" | "OR" | "NOT" | "XOR";

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

export type LevelData = {
    id: number;
    pieces: LevelPiece[];
};
