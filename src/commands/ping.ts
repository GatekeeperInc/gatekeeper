import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { DiscordClient } from '../DiscordClient.js';
import type { PrismaClient } from '@prisma/client/extension';

export default {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    async execute(interaction: ChatInputCommandInteraction, _ : PrismaClient) {
        await interaction.reply('Pong!');
    },
};
