import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { AppContext } from '../types.js';
import { GuildSettingsMissingError, getGuildSettings, resolveGuildDisplayName, sendOfficerChannelMessage } from '../services/guildSettings.js';
import { resolveTrial } from '../services/trialService.js';
import { createGuildLogger, audit } from '../services/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('fail')
        .setDescription('Fails the trial')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to fail the trial for')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, context: AppContext) {
        const target = interaction.options.getUser('target');
        const guild = interaction.guild;

        if (!guild || !interaction.guildId) {
            await interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true,
            });
            return;
        }

        const log = createGuildLogger(interaction.guildId);

        if (!target) {
            await interaction.reply({
                content: 'Target user is required.',
                ephemeral: true,
            });
            return;
        }

        let settings;

        try {
            settings = await getGuildSettings(context.prisma, interaction.guildId);
        } catch (error) {
            if (error instanceof GuildSettingsMissingError) {
                await interaction.reply({
                    content: 'Server settings have not been configured yet. Run `/settings` first.',
                    ephemeral: true,
                });
                return;
            }

            log.error({ err: error }, 'Error retrieving guild settings.');
            await interaction.reply({
                content: 'An error occurred while retrieving server settings. Please try again later.',
                ephemeral: true,
            });
            return;
        }

        try {
            const result = await resolveTrial(context.prisma, interaction.guildId, target.id, false);
            if (!result.updated) {
                log.info({ targetId: target.id }, 'Fail rejected: no active trial found.');
                await interaction.reply({
                    content: `No active trial found for ${target.tag}.`,
                    ephemeral: true,
                });
                return;
            }
            log.info({ targetId: target.id, trialId: result.trialId }, 'Trial marked as failed.');
            audit(interaction.guildId, 'trial.failed', interaction.user.id, { targetId: target.id, trialId: result.trialId });
        } catch (error) {
            log.error({ targetId: target.id, err: error }, 'Error failing trial.');
            await interaction.reply({
                content: 'An error occurred while failing the trial. Please try again later.',
                ephemeral: true,
            });
            return;
        }

        try {
            const member = await guild.members.fetch(target.id);
            await member.roles.remove(settings.trialRoleId);
        } catch (error) {
            log.error({ targetId: target.id, trialRoleId: settings.trialRoleId, err: error }, 'Error removing trial role on fail.');
            await interaction.reply({
                content: 'Trial was failed, but I could not remove the trial role. Please check my role permissions.',
                ephemeral: true,
            });
            return;
        }

        const displayName = await resolveGuildDisplayName(context.client, interaction.guildId, target.id, target.displayName);
        const message = `Trial failed for ${displayName}!`;
        const sendResult = await sendOfficerChannelMessage(context.client, settings.officerChannelId, message);

        if (!sendResult.delivered) {
            await interaction.reply({
                content: 'Trial was failed, but I could not send the update to the officer channel. Please check channel settings and permissions.',
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            content: 'Posted fail update in the officer channel.',
            ephemeral: true,
        });
    },
};
