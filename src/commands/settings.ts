import {
    ChannelSelectMenuBuilder,
    LabelBuilder,
    ModalBuilder,
    RoleSelectMenuBuilder,
    SlashCommandBuilder,
    UserSelectMenuBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js';
import type { PrismaClient } from '../generated/prisma/client.js';


/* 
     trialRoleId String
  raiderRoleId String
  officerChannelId String
     
*/

export default {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Allows moderators to adjust settings for the trial tracker'),
    async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true,
            });
            return;
        }

        const settings = await prisma.settings.findFirst({
            where: { guildId },
        });

        const modal = new ModalBuilder()
            .setCustomId('settingsModal')
            .setTitle(`Settings for Gatekeeper`);

        const officerChannelInput = new ChannelSelectMenuBuilder()
            .setCustomId('officerChannelId')
            .setPlaceholder('Select the channel for officer notifications')
            .setChannelTypes([0]) // 0 is for text channels
            .setDefaultChannels(settings?.officerChannelId ? [settings.officerChannelId] : [])
            .setMaxValues(1)
            .setRequired(true);

        const officerChannelLabel = new LabelBuilder()
            .setLabel('Officer Notification Channel')
            .setChannelSelectMenuComponent(officerChannelInput);

        const raiderRoleInput = new RoleSelectMenuBuilder()
            .setCustomId('raiderRoleId')
            .setPlaceholder('Select the raider role')
            .setDefaultRoles(settings?.raiderRoleId ? [settings.raiderRoleId] : [])
            .setMaxValues(1)
            .setRequired(true);

        const raiderRoleLabel = new LabelBuilder()
            .setLabel('Raider Role')
            .setRoleSelectMenuComponent(raiderRoleInput);

        const trialRoleInput = new RoleSelectMenuBuilder()
            .setCustomId('trialRoleId')
            .setPlaceholder('Select the trial role')
            .setDefaultRoles(settings?.trialRoleId ? [settings.trialRoleId] : [])
            .setMaxValues(1)
            .setRequired(true);

        const trialRoleLabel = new LabelBuilder()
            .setLabel('Trial Role')
            .setRoleSelectMenuComponent(trialRoleInput);

        modal.addLabelComponents(officerChannelLabel, raiderRoleLabel, trialRoleLabel);

        await interaction.showModal(modal);

    },

};
