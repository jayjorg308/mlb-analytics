"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    typography: {
        fontFamily: "var(--font-geist-sans), var(--font-geist-mono), sans-serif",
    },
    palette: {
        primary: {
            main: "#046A38",
        }
    }
});

export default theme;
