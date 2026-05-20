import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { AppContext } from '../types.js';
import { GuildSettingsMissingError, getGuildSettings, sendOfficerChannelMessage } from '../services/guildSettings.js';
import { createGuildLogger } from '../services/logger.js';

export default {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    async execute(interaction: ChatInputCommandInteraction, context: AppContext) {
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true,
            });
            return;
        }

        let settings;

        try {
            settings = await getGuildSettings(context.prisma, guildId);
        } catch (error) {
            if (error instanceof GuildSettingsMissingError) {
                await interaction.reply({
                    content: 'Server settings have not been configured yet. Run `/settings` first.',
                    ephemeral: true,
                });
                return;
            }

            createGuildLogger(guildId).error({ err: error }, 'Error retrieving guild settings.');
            await interaction.reply({
                content: 'An error occurred while retrieving server settings. Please try again later.',
                ephemeral: true,
            });
            return;
        }

        const sendResult = await sendOfficerChannelMessage(context.client, settings.officerChannelId, 'Pong!');

        if (!sendResult.delivered) {
            createGuildLogger(guildId).warn({ reason: sendResult.reason }, 'Ping: failed to deliver to officer channel.');
            await interaction.reply({
                content: 'I could not send the ping response to the officer channel. Please check channel settings and permissions.',
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            content: 'Posted ping response in the officer channel.',
            ephemeral: true,
        });
    },
};
