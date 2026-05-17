import type { PrismaClient, Settings } from '../generated/prisma/client.js';
import type { DiscordClient } from '../DiscordClient.js';
import type { APIEmbed } from 'discord.js';

export class GuildSettingsMissingError extends Error {
    constructor(guildId: string) {
        super(`Settings have not been configured for guild ${guildId}.`);
        this.name = 'GuildSettingsMissingError';
    }
}

export async function findGuildSettings(prisma: PrismaClient, guildId: string): Promise<Settings | null> {
    return prisma.settings.findUnique({
        where: { guildId },
    });
}

export async function getGuildSettings(prisma: PrismaClient, guildId: string): Promise<Settings> {
    const settings = await findGuildSettings(prisma, guildId);

    if (!settings) {
        throw new GuildSettingsMissingError(guildId);
    }

    return settings;
}

export async function saveGuildSettings(
    prisma: PrismaClient,
    settings: {
        guildId: string;
        officerChannelId: string;
        trialRoleId: string;
        raiderRoleId: string;
    },
): Promise<Settings> {
    return prisma.settings.upsert({
        where: { guildId: settings.guildId },
        update: {
            officerChannelId: settings.officerChannelId,
            trialRoleId: settings.trialRoleId,
            raiderRoleId: settings.raiderRoleId,
        },
        create: settings,
    });
}

export type OfficerChannelMessageResult =
    | { delivered: true }
    | { delivered: false; reason: 'channel_not_found' | 'channel_not_text_based' | 'send_failed' };

export type OfficerChannelMessagePayload =
    | string
    | {
        content?: string;
        embeds?: APIEmbed[];
    };

export async function sendOfficerChannelMessage(
    client: DiscordClient,
    officerChannelId: string,
    payload: OfficerChannelMessagePayload,
): Promise<OfficerChannelMessageResult> {
    const channel = await client.channels.fetch(officerChannelId);

    if (!channel) {
        return { delivered: false, reason: 'channel_not_found' };
    }

    if (!channel.isTextBased() || !('send' in channel)) {
        return { delivered: false, reason: 'channel_not_text_based' };
    }

    try {
        if (typeof payload === 'string') {
            await channel.send({ content: payload });
        } else {
            await channel.send(payload);
        }

        return { delivered: true };
    } catch {
        return { delivered: false, reason: 'send_failed' };
    }
}

export async function resolveGuildDisplayName(
    client: DiscordClient,
    guildId: string,
    userId: string,
    fallbackName: string,
): Promise<string> {
    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);
        return member.displayName;
    } catch {
        return fallbackName;
    }
}
