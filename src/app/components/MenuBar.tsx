"use client";
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Menu, MenuItem } from "@mui/material";
import Link from "next/link";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

export const MenuBar = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="sticky" color="primary">
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                {/* Styled Site Name */}
                <Typography
                    variant="h6"
                    component={Link}
                    href="/"
                    sx={{
                        textDecoration: "none",
                        color: "inherit",
                        //fontFamily: "Oswald, sans-serif",
                        fontWeight: 700,
                        fontSize: "1.5rem",
                    }}
                >
                    Gamblers Anonymous
                </Typography>

                {/* Desktop Links (Hidden on Small Screens) */}
                <Box sx={{ display: { xs: "none", md: "flex" } }}>
                    <Button color="inherit" component={Link} href="/stats">
                        Stats
                    </Button>
                </Box>

                {/* Mobile Dropdown (Visible on Small Screens) */}
                <IconButton color="inherit" sx={{ display: { xs: "flex", md: "none" } }} onClick={handleMenuOpen}>
                    <MenuIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    sx={{ display: { xs: "block", md: "none" } }}
                >
                    <MenuItem component={Link} href="/stats" onClick={handleMenuClose}>
                        Stats
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};
