"use client";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { Geist, Geist_Mono } from "next/font/google";
import theme from "./theme";
import { Box, CssBaseline } from "@mui/material";
import { MenuBar } from "./components/MenuBar";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import Footer from "./components/Footer";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body style={{ margin: 0 }} className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AppRouterCacheProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <MenuBar />
                            <Box>{children}</Box>
                            {/* <Footer /> */}
                        </LocalizationProvider>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
