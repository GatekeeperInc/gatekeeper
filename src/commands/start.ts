import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../generated/prisma/client.js';


// Starting a trial should create a new trial entry in the database and reply with a confirmation message. 
// It should also ensure that the trial target is given the trial role 
// It should check if the user already has an active trial and prevent starting a new one if they do.
// The trial entry should include the user who started the trial, the start time, and any other relevant information.

export default {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Starts the trial')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to start the trial for')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
        const target = interaction.options.getUser('target');

        try {
            const activeTrial = await prisma.trial.findFirst({
                where: {
                    userId: target?.id || '',
                },
            });

            if (activeTrial) {
                await interaction.reply(`${target?.tag} already has an active trial.`);
                return;
            }
        } catch (error) {
            console.error('Error checking for active trial:', error);
            await interaction.reply('An error occurred while checking for active trials. Please try again later.');
            return;
        }

        try {

            await prisma.trial.create({
                data: {
                    userId: target?.id || '',
                    active: true,
                    startedById: interaction.user.id,
                    startTime: new Date(),
                },
            });
        } catch (error) {
            console.error('Error creating trial:', error);
            await interaction.reply('An error occurred while starting the trial. Please try again later.');
            return;
        }

        await interaction.reply(`Trial started for ${target?.tag}!`);
    },
};
