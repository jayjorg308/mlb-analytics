import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// todo: automate this after games are played

async function fixIP() {
    try {
        const pitchers = await prisma.playerSeasonPitchingStats.findMany({
            where: {
                seasonId: 1,
            },
        });

        for (const pitcher of pitchers) {
            const gamesPitched = await prisma.playerGamePitchingStats.findMany({
                where: {
                    playerId: pitcher.playerId,
                },
                select: {
                    inningsPitched: true,
                },
            });

            // Calculate total innings pitched taking into consideration that innings pitched could be a decimal
            // Innings pitched should only have 1 decimal place and should be .0, .1, or .2
            // When we add them together, we need to add the decimals separately and then convert them to innings
            // 0.3 equals 1 full inning, so we need to add 1 to the total innings pitched
            const totalInningsPitched = gamesPitched.reduce(
                (acc, game) => {
                    const innings = Math.floor(game.inningsPitched);
                    const decimal = game.inningsPitched - innings;
                    return {
                        innings: acc.innings + innings,
                        decimal: parseFloat((acc.decimal + decimal).toFixed(1)),
                    };
                },
                { innings: 0, decimal: 0 },
            );

            // if decimal is greater than or equal to 0.3, convert decimal to innings
            if (totalInningsPitched.decimal >= 0.3) {
                totalInningsPitched.innings += Math.floor(totalInningsPitched.decimal / 0.3);
                totalInningsPitched.decimal = parseFloat((totalInningsPitched.decimal % 0.3).toFixed(1));
            }

            const totalIP = totalInningsPitched.innings + totalInningsPitched.decimal;

            await prisma.playerSeasonPitchingStats.update({
                where: {
                    playerId_seasonId: {
                        playerId: pitcher.playerId,
                        seasonId: 1,
                    },
                },
                data: {
                    inningsPitched: totalIP,
                },
            });

            console.log(`Updated player: ${pitcher.playerId} innings pitched: ${totalIP}`);
        }
    } catch (error) {
        console.error("Error updating player innings pitched:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixIP();
