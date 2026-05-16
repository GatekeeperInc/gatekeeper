import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { PrismaClient } from '../generated/prisma/client.js';

// Starting a trial should create a new trial entry in the database and reply with a confirmation message. 
// It should also ensure that the trial target is given the trial role 
// It should check if the user already has an active trial and prevent starting a new one if they do.
// The trial entry should include the user who started the trial, the start time, and any other relevant information.

export default {
    data: new SlashCommandBuilder()
        .setName('fail')
        .setDescription('Fails the trial')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to fail the trial for')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
        const target = interaction.options.getUser('target');

        // set trial status to failed in database, remove trial role from user, add failed role and reply with confirmation message

        await interaction.reply(`Trial failed for ${target?.tag}!`);
    },
};
