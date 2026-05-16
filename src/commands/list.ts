// lists trials, takes active as a optional argument to filter by active/inactive trials, defaults to active trials only

import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/*
The list command should retrieve trial entries from the database and display them in a user-friendly format. 
It should support an optional argument to filter by active or inactive trials, defaulting to active trials only. 
The displayed information should include the user on trial, the start time, the status of the trial, and any other relevant details.
*/

export default {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Lists all trials')
        .addBooleanOption(option =>
            option.setName('active')
                .setDescription('Whether to list only active trials')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
        const activeOnly = interaction.options.getBoolean('active') ?? true;

        try {
            const trials = await prisma.trial.findMany({
                where: {
                    active: activeOnly,
                },
            });

            if (trials.length === 0) {
                await interaction.reply('No trials found.');
                return;
            }

            const trialList = trials.map(trial => {
                const status = trial.active ? 'Active' : trial.passed ? 'Passed' : 'Failed';
                return `User: <@${trial.userId}>, Start Time: ${trial.startTime.toLocaleString()}, Status: ${status}`;
            }).join('\n');

            await interaction.reply(`Trials:\n${trialList}`);
        } catch (error) {
            console.error('Error retrieving trials:', error);
            await interaction.reply('An error occurred while retrieving trials. Please try again later.');
        }
    },
};