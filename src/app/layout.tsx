import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { Geist, Geist_Mono } from "next/font/google";
import theme from "./theme";
import { Box } from "@mui/material";
import { MenuBar } from "./components/MenuBar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Gamblers Anonymous",
    description: "Not the actual one.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AppRouterCacheProvider>
                    <ThemeProvider theme={theme}>
                        <MenuBar />
                        <Box>{children}</Box>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
