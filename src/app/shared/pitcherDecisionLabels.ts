import { PitcherDecision } from "@prisma/client";

export const DECISION_LABEL: Record<PitcherDecision, string> = {
    WIN: "W",
    LOSS: "L",
    SAVE: "SV",
    HOLD: "HLD",
    NO_DECISION: "ND",
};

export const DECISION_COLOR: Record<PitcherDecision, "success" | "error" | "info" | "warning" | "default"> = {
    WIN: "success",
    LOSS: "error",
    SAVE: "info",
    HOLD: "warning",
    NO_DECISION: "default",
};
