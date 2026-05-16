import { GatewayIntentBits } from "discord.js";
import { DiscordClient } from "./DiscordClient.js";
import { PrismaClient } from "./generated/prisma/client.js";
import { prisma } from "./prisma.js";

console.log("Starting bot...");

const client: DiscordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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
}).then(async () => {
    prisma.$disconnect()
});