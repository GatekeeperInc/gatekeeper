import {
    ModalBuilder,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js';
import type { DiscordClient } from '../DiscordClient.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/* 
    This form collects feedback from officers about a trial's performance 

    Performance 1-5
    Attitude 1-5
    Focus 1-5
    Late (Y/N)
    Comments (text field)

    the officer giving the feedback should be recorded

    each officer should give feedback for each trial each raid night while the trial is active, 
    and the feedback should be stored in the database and associated with the trial and the officer who gave it.

    after 4 entries, the feedback should be averaged, maybe an ai summary of the comments should be generated,
    and the trial should be marked as completed and removed from the active trials list.

    the report should be sent as a message in a moderator channel, and should have voting buttons
    for "Promote", "Extend Trial", and "Reject".
     
*/

export default {
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('Provides a feedback form for users to submit their feedback.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to provide feedback for')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
        const target = interaction.options.getUser('target');

        console.log(`Feedback command invoked for target: ${target?.tag}`);

        const modal = new ModalBuilder()
            .setCustomId('feedbackModal')
            .setTitle(`Feedback for ${target?.tag || 'Unknown User'}`);

        // needs components to work 

        await interaction.showModal(modal);
    },
};
