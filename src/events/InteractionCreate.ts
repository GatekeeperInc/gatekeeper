import { Events, type Interaction } from 'discord.js';
import type { DiscordClient } from '../DiscordClient.js';
import { prisma } from '../prisma.js';


export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction, client: DiscordClient) {
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'settingsModal') {
                console.log(interaction.fields);
                const officerChannelId = interaction.fields.getSelectedChannels('officerChannelId')?.first()?.id;
                const trialRoleId = interaction.fields.getSelectedRoles('trialRoleId')?.first()?.id;
                const raiderRoleId = interaction.fields.getSelectedRoles('raiderRoleId')?.first()?.id;

                if (!officerChannelId || !trialRoleId || !raiderRoleId) {
                    await interaction.reply({ content: 'All fields are required', flags: ['Ephemeral'] });
                    return;
                }

                const guildId = interaction.guildId;
                if (!guildId) {
                    await interaction.reply({ content: 'Guild ID is missing.', flags: ['Ephemeral'] });
                    return;
                }

                const { id } = await prisma.settings.findFirst({
                    where: { 
                        guildId, 
                    },
                    select: { id: true },
                }) || { id: null };

                await prisma.settings.upsert({
                    where: { id: id ?? -1  },
                    update: {
                        officerChannelId,
                        trialRoleId,
                        raiderRoleId,
                    },
                    create: {
                        guildId: interaction.guildId!,
                        officerChannelId,
                        trialRoleId,
                        raiderRoleId,
                    },
                });


                // Handle settings modal submission
                await interaction.reply({ content: 'Settings updated!', flags: ['Ephemeral'] });
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, prisma);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
        }
    }
};
