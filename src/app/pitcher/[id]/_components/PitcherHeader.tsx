import Image from "next/image";
import { Avatar, Box, Chip, Typography } from "@mui/material";
import type { PitcherDetail } from "@/app/shared/pitcherDetail";

export default function PitcherHeader({ pitcher, team }: { pitcher: PitcherDetail["pitcher"]; team: PitcherDetail["team"] }) {
    const initials = `${pitcher.firstName[0] ?? ""}${pitcher.lastName[0] ?? ""}`.toUpperCase();
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            {pitcher.photoUrl ? (
                <Image
                    src={pitcher.photoUrl}
                    alt={`${pitcher.firstName} ${pitcher.lastName}`}
                    width={96}
                    height={96}
                    style={{ borderRadius: "50%" }}
                />
            ) : (
                <Avatar sx={{ width: 96, height: 96, fontSize: 32, bgcolor: "primary.main" }}>
                    {initials}
                </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                    {pitcher.firstName} {pitcher.lastName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
                    {team && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Image src={team.logoUrl} alt={team.abbreviation} width={24} height={24} />
                            <Typography variant="body1" color="text.secondary">
                                {team.name}
                            </Typography>
                        </Box>
                    )}
                    <Chip label={pitcher.position} size="small" variant="outlined" />
                    {pitcher.uniformNumber != null && (
                        <Chip label={`#${pitcher.uniformNumber}`} size="small" variant="outlined" />
                    )}
                </Box>
            </Box>
        </Box>
    );
}
