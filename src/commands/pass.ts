import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../generated/prisma/client.js';


// Starting a trial should create a new trial entry in the database and reply with a confirmation message. 
// It should also ensure that the trial target is given the trial role 
// It should check if the user already has an active trial and prevent starting a new one if they do.
// The trial entry should include the user who started the trial, the start time, and any other relevant information.

export default {
    data: new SlashCommandBuilder()
        .setName('pass')
        .setDescription('Passes the trial')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to pass the trial for')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
        const target = interaction.options.getUser('target');

        // set trial status to passed in database, remove trial role from user, add raider role and reply with confirmation message

        const {
            id,
        } = await prisma.trial.findFirst({
            where: {
                userId: target?.id || '',
                active: true,
            },
            select: {
                id: true,
            },
        }) || {};

        if (!id) {
            await interaction.reply(`No active trial found for ${target?.tag}.`);
            return;
        }

        prisma.trial.update({
            where: {
                id: id
            },
            data: {
                active: false,
                passed: true,
            },
        }).catch(error => {
            console.error('Error updating trial:', error);
            interaction.reply('An error occurred while passing the trial. Please try again later.');
        });

        // Emit trial passed event here so that we can handle role changes and other side effects in a centralized location
        

        await interaction.reply(`Trial passed for ${target?.tag}!`);
    },
};
