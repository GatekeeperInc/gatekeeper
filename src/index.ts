import { GatewayIntentBits } from "discord.js";
import { DiscordClient } from "./DiscordClient.js";
import { prisma } from "./prisma.js";

console.log("Starting bot...");

const client: DiscordClient = new DiscordClient(
    { intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] },
    prisma,
);

await client.loadCommands();
await client.loadEvents();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error("DISCORD_TOKEN environment variable is not set.");
    process.exit(1);
}

await client.login(token).catch((error) => {
    console.error("Failed to login:", error);
    prisma.$disconnect();
    process.exit(1);
});

console.log("Bot logged in and listening for interactions...");

// Graceful shutdown: disconnect Prisma only on process exit
process.on('SIGINT', async () => {
    console.log("SIGINT received, shutting down...");
    await client.destroy();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log("SIGTERM received, shutting down...");
    await client.destroy();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('exit', async () => {
    await prisma.$disconnect();
});