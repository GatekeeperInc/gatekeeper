import { Events, type Client } from 'discord.js';
import type { AppContext } from '../types.js';
import { startRaidReminderScheduler } from '../services/raidReminderScheduler.js';

export default {
    name: Events.ClientReady,
    async execute(client: Client<true>, context: AppContext) {
        console.log(`Logged in as ${client.user?.tag}!`);
        await startRaidReminderScheduler(context);
    }
};
