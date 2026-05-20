import {
    Events,
    type Interaction,
    type ModalSubmitInteraction,
    type ChatInputCommandInteraction,
} from 'discord.js';
import type { AppContext } from '../types.js';
import { createFeedback, parseFeedbackModalCustomId } from '../services/feedbackService.js';
import { saveGuildSettings, validateRaidReminderSettings } from '../services/guildSettings.js';
import { refreshGuildRaidReminderSchedule } from '../services/raidReminderScheduler.js';
import { logger, audit } from '../services/logger.js';

async function handleSettingsModal(interaction: ModalSubmitInteraction, context: AppContext): Promise<void> {
    const officerChannelId = interaction.fields.getSelectedChannels('officerChannelId')?.first()?.id;
    const trialRoleId = interaction.fields.getSelectedRoles('trialRoleId')?.first()?.id;
    const raiderRoleId = interaction.fields.getSelectedRoles('raiderRoleId')?.first()?.id;
    const raidScheduleCronRaw = interaction.fields.getTextInputValue('raidScheduleCron').trim();
    const raidThresholdRaw = interaction.fields.getTextInputValue('raidAttendanceReminderThreshold').trim();

    if (!officerChannelId || !trialRoleId || !raiderRoleId) {
        await interaction.reply({ content: 'All fields are required', flags: ['Ephemeral'] });
        return;
    }

    if (!interaction.guildId) {
        await interaction.reply({ content: 'Guild ID is missing.', flags: ['Ephemeral'] });
        return;
    }

    const raidThreshold = raidThresholdRaw.length === 0 ? null : Number(raidThresholdRaw);
    const validation = validateRaidReminderSettings({
        raidScheduleCron: raidScheduleCronRaw.length === 0 ? null : raidScheduleCronRaw,
        raidAttendanceReminderThreshold: raidThreshold,
    });

    if (!validation.valid) {
        await interaction.reply({ content: validation.reason, flags: ['Ephemeral'] });
        return;
    }

    await saveGuildSettings(context.prisma, {
        guildId: interaction.guildId,
        officerChannelId,
        trialRoleId,
        raiderRoleId,
        raidScheduleCron: validation.normalizedCron,
        raidAttendanceReminderThreshold: validation.normalizedThreshold,
    });

    await refreshGuildRaidReminderSchedule(context, interaction.guildId);

    audit(interaction.guildId, 'settings.updated', interaction.user.id, {
        officerChannelId,
        trialRoleId,
        raiderRoleId,
        raidScheduleCron: validation.normalizedCron,
        raidAttendanceReminderThreshold: validation.normalizedThreshold,
    });

    await interaction.reply({ content: 'Settings updated!', flags: ['Ephemeral'] });
}

async function handleFeedbackModal(interaction: ModalSubmitInteraction, context: AppContext): Promise<void> {
    const feedbackContext = parseFeedbackModalCustomId(interaction.customId);
    if (!feedbackContext) {
        await interaction.reply({ content: 'Feedback context is missing. Please rerun `/feedback`.', flags: ['Ephemeral'] });
        return;
    }

    if (!interaction.guildId) {
        await interaction.reply({ content: 'Guild context is missing.', flags: ['Ephemeral'] });
        return;
    }

    const performance = Number(interaction.fields.getTextInputValue('performance'));
    const attitude = Number(interaction.fields.getTextInputValue('attitude'));
    const focus = Number(interaction.fields.getTextInputValue('focus'));
    const late = interaction.fields.getCheckbox('late');
    const comments = interaction.fields.getTextInputValue('comments').trim();

    const values = [performance, attitude, focus];
    const areScoresValid = values.every((value) => Number.isInteger(value) && value >= 1 && value <= 5);
    if (!areScoresValid) {
        await interaction.reply({ content: 'Performance, attitude, and focus must be whole numbers from 1 to 5.', flags: ['Ephemeral'] });
        return;
    }

    const result = await createFeedback(context.prisma, {
        guildId: interaction.guildId,
        trialId: feedbackContext.trialId,
        targetId: feedbackContext.targetId,
        officerId: interaction.user.id,
        performance,
        attitude,
        focus,
        late,
        comments: comments.length > 0 ? comments : undefined,
    });

    if (!result.created) {
        const content = result.reason === 'trial_not_active'
            ? 'This trial is no longer active. Feedback was not saved.'
            : 'Trial not found for this server. Feedback was not saved.';

        logger.warn(
            { guildId: interaction.guildId, trialId: feedbackContext.trialId, officerId: interaction.user.id, reason: result.reason },
            'Feedback submission rejected.',
        );

        await interaction.reply({ content, flags: ['Ephemeral'] });
        return;
    }

    audit(interaction.guildId, 'feedback.submitted', interaction.user.id, {
        trialId: feedbackContext.trialId,
        targetId: feedbackContext.targetId,
    });

    await interaction.reply({ content: 'Feedback received and saved. Thank you!', flags: ['Ephemeral'] });
}

async function handleChatCommand(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    const command = context.getCommand(interaction.commandName);

    if (!command) {
        logger.error({ command: interaction.commandName, guildId: interaction.guildId }, 'No handler found for command.');
        return;
    }

    logger.info({ command: interaction.commandName, guildId: interaction.guildId, userId: interaction.user.id }, 'Executing command.');

    try {
        await command.execute(interaction, context);
    } catch (error) {
        logger.error({ command: interaction.commandName, guildId: interaction.guildId, err: error }, 'Unhandled error executing command.');
    }
}


export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction, context: AppContext) {
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'settingsModal') {
                await handleSettingsModal(interaction, context);
                return;
            }

            await handleFeedbackModal(interaction, context);
            return;
        }

        if (!interaction.isChatInputCommand()) return;
        await handleChatCommand(interaction, context);
    }
};
