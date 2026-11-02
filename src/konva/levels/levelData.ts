export type GateType = "AND" | "OR" | "NOT" | "XOR";

export type LevelPiece =
    | { type: "gate"; gateType: GateType; x: number; y: number }
    | { type: "wire"; x: number; y: number };

export type LevelData = {
    id: number;
    pieces: LevelPiece[];
};

