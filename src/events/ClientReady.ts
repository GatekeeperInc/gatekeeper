import { Events, type Client } from 'discord.js';
import type { AppContext } from '../types.js';

export default {
    name: Events.ClientReady,
    async execute(client: Client<true>, _: AppContext) {
        console.log(`Logged in as ${client.user?.tag}!`);
    }
};
