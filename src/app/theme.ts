"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    typography: {
        fontFamily: "var(--font-geist-sans), var(--font-geist-mono), sans-serif",
    },
    palette: {
        primary: {
            main: "#7e8c54",
        },
        secondary: { main: "#BE5103" },
        background: { default: "#FFFFFF" },
        text: { primary: "#212121" },
    },
});

export default theme;
