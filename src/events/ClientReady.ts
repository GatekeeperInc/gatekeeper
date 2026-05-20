import { Events, type Client } from 'discord.js';
import type { AppContext } from '../types.js';
import { startRaidReminderScheduler } from '../services/raidReminderScheduler.js';
import { logger } from '../services/logger.js';

export default {
    name: Events.ClientReady,
    async execute(client: Client<true>, context: AppContext) {
        logger.info({ tag: client.user?.tag }, `Logged in as ${client.user?.tag}`);

        try {
            await startRaidReminderScheduler(context);
        } catch (error) {
            logger.error({ err: error }, 'Failed to initialize raid reminder scheduler.');
        }
    }
};
