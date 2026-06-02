"use client";
import { useState, ReactNode, KeyboardEvent } from "react";
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PitcherSeasonScoreChart from "@/app/components/PitcherSeasonScoreChart";

type Pitcher = {
    id: number;
    firstName: string;
    lastName: string;
};

export default function PitcherDialog({ pitcher, children }: { pitcher: Pitcher; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
        }
    };

    return (
        <>
            <Box
                role="button"
                tabIndex={0}
                onClick={handleOpen}
                onKeyDown={onKeyDown}
                sx={{
                    cursor: "pointer",
                    borderRadius: 1,
                    transition: "background-color 0.15s",
                    "&:hover": { backgroundColor: "action.hover" },
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
                }}
            >
                {children}
            </Box>
            <Dialog
                fullScreen={fullScreen}
                open={open}
                onClose={handleClose}
                aria-labelledby="pitcher-details-title"
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle id="pitcher-details-title">
                    {pitcher.firstName} {pitcher.lastName}
                </DialogTitle>
                <DialogContent>
                    <PitcherSeasonScoreChart pitcherId={pitcher.id} />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleClose} autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
