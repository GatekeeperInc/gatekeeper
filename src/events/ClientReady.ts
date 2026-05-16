import { Events } from 'discord.js';
import type { DiscordClient } from '../DiscordClient.js';

export default {
    name: Events.ClientReady,
    async execute(client: DiscordClient) {
        console.log(`Logged in as ${client.user?.tag}!`);
    }
};
