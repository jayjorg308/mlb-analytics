// import { PrismaClient } from "@prisma/client";
// import AWS from "aws-sdk";
// import fetch from "node-fetch";
// import * as dotenv from "dotenv";
// dotenv.config();

// const prisma = new PrismaClient();

// const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACE_ENDPOINT!);
// const s3 = new AWS.S3({
//     endpoint: spacesEndpoint,
//     accessKeyId: process.env.DO_SPACE_KEY!,
//     secretAccessKey: process.env.DO_SPACE_SECRET!,
//     region: process.env.DO_SPACE_REGION!,
// });

// async function downloadAndUploadHeadshots() {
//     const players = await prisma.player.findMany({
//         where: {
//             mlb_person_id: { not: null },
//         },
//     });

//     for (const player of players) {
//         const mlbId = player.mlb_person_id!;
//         const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/v1/people/${mlbId}/headshot/67/current.jpg`;

//         try {
//             const res = await fetch(headshotUrl);
//             if (!res.ok) throw new Error(`Failed to download: ${headshotUrl}`);

//             const arrayBuffer = await res.arrayBuffer();
//             const buffer = Buffer.from(arrayBuffer);
//             const key = `headshots/${mlbId}.jpg`; // You can change path if needed

//             // Upload to DigitalOcean Space
//             await s3
//                 .putObject({
//                     Bucket: process.env.DO_SPACE_NAME!,
//                     Key: key,
//                     Body: buffer,
//                     ACL: "public-read",
//                     ContentType: "image/jpeg",
//                 })
//                 .promise();

//             const publicUrl = `https://${process.env.DO_SPACE_NAME}.${process.env.DO_SPACE_REGION}.digitaloceanspaces.com/${key}`;

//             // Update player record
//             await prisma.player.update({
//                 where: { id: player.id },
//                 data: { photoUrl: publicUrl },
//             });

//             console.log(`Uploaded headshot for ${player.firstName} ${player.lastName}`);
//         } catch (err) {
//             console.error(`Error processing player ID ${mlbId}:`, err);
//         }
//     }

//     await prisma.$disconnect();
// }

// downloadAndUploadHeadshots().catch((e) => {
//     console.error(e);
//     prisma.$disconnect();
// });
