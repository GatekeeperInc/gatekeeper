import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { AppContext } from '../types.js';
import { GuildSettingsMissingError, getGuildSettings, resolveGuildDisplayName, sendOfficerChannelMessage } from '../services/guildSettings.js';
import { resolveTrial } from '../services/trialService.js';

async function getValidatedTarget(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('target');
    if (!target) {
        await interaction.reply({
            content: 'Target user is required.',
            ephemeral: true,
        });
        return null;
    }

    return target;
}

async function getValidatedGuildContext(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    const guildId = interaction.guildId;

    if (!guild || !guildId) {
        await interaction.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true,
        });
        return null;
    }

    return { guild, guildId };
}

async function getSettingsOrReply(interaction: ChatInputCommandInteraction, context: AppContext, guildId: string) {
    try {
        return await getGuildSettings(context.prisma, guildId);
    } catch (error) {
        if (error instanceof GuildSettingsMissingError) {
            await interaction.reply({
                content: 'Server settings have not been configured yet. Run `/settings` first.',
                ephemeral: true,
            });
            return null;
        }

        console.error('Error retrieving guild settings:', error);
        await interaction.reply({
            content: 'An error occurred while retrieving server settings. Please try again later.',
            ephemeral: true,
        });
        return null;
    }
}

async function updateRolesOrReply(
    interaction: ChatInputCommandInteraction,
    guild: NonNullable<ChatInputCommandInteraction['guild']>,
    userId: string,
    trialRoleId: string,
    raiderRoleId: string,
) {
    try {
        const member = await guild.members.fetch(userId);
        await member.roles.remove(trialRoleId);
        await member.roles.add(raiderRoleId);
        return true;
    } catch (error) {
        console.error('Error updating member roles:', error);
        await interaction.reply({
            content: 'Trial was passed, but I could not update the member roles. Please check my role permissions.',
            ephemeral: true,
        });
        return false;
    }
}


// Passing a trial should update the trial entry in the database, remove the trial role, add the raider role, and reply with a confirmation message.

export default {
    data: new SlashCommandBuilder()
        .setName('pass')
        .setDescription('Passes the trial')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to pass the trial for')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, context: AppContext) {
        const guildContext = await getValidatedGuildContext(interaction);
        if (!guildContext) {
            return;
        }

        const { guild, guildId } = guildContext;

        const target = await getValidatedTarget(interaction);
        if (!target) {
            return;
        }

        const settings = await getSettingsOrReply(interaction, context, guildId);
        if (!settings) {
            return;
        }

        try {
            const result = await resolveTrial(context.prisma, guildId, target.id, true);
            if (!result.updated) {
                await interaction.reply({
                    content: `No active trial found for ${target.tag}.`,
                    ephemeral: true,
                });
                return;
            }
        } catch (error) {
            console.error('Error updating trial:', error);
            await interaction.reply({
                content: 'An error occurred while passing the trial. Please try again later.',
                ephemeral: true,
            });
            return;
        }

        const rolesUpdated = await updateRolesOrReply(
            interaction,
            guild,
            target.id,
            settings.trialRoleId,
            settings.raiderRoleId,
        );
        if (!rolesUpdated) {
            return;
        }

        const displayName = await resolveGuildDisplayName(context.client, guildId, target.id, target.displayName);
        const message = `Trial passed for ${displayName}!`;
        const sendResult = await sendOfficerChannelMessage(context.client, settings.officerChannelId, message);

        if (!sendResult.delivered) {
            await interaction.reply({
                content: 'Trial was passed, but I could not send the update to the officer channel. Please check channel settings and permissions.',
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            content: 'Posted pass update in the officer channel.',
            ephemeral: true,
        });
    },
};
