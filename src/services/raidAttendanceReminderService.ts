import type { AppContext } from '../types.js';
import { listActiveTrialAttendance } from './feedbackService.js';
import {
    findGuildSettings,
    resolveGuildDisplayName,
    sendOfficerChannelMessage,
} from './guildSettings.js';
import { buildRaidAttendanceReminderEmbed } from './embedBuilders.js';

function toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export type RaidAttendanceReminderRunResult = {
    guildId: string;
    skipped: boolean;
    skippedReason?: 'settings_missing' | 'schedule_not_configured';
    candidatesEvaluated: number;
    remindersSent: number;
    remindersSkippedAsDuplicate: number;
    deliveryFailures: number;
};

export async function runGuildRaidAttendanceReminderCycle(
    context: AppContext,
    guildId: string,
): Promise<RaidAttendanceReminderRunResult> {
    const settings = await findGuildSettings(context.prisma, guildId);

    if (!settings) {
        return {
            guildId,
            skipped: true,
            skippedReason: 'settings_missing',
            candidatesEvaluated: 0,
            remindersSent: 0,
            remindersSkippedAsDuplicate: 0,
            deliveryFailures: 0,
        };
    }

    if (!settings.raidScheduleCron || !settings.raidAttendanceReminderThreshold) {
        return {
            guildId,
            skipped: true,
            skippedReason: 'schedule_not_configured',
            candidatesEvaluated: 0,
            remindersSent: 0,
            remindersSkippedAsDuplicate: 0,
            deliveryFailures: 0,
        };
    }

    const attendance = await listActiveTrialAttendance(context.prisma, guildId);
    const threshold = settings.raidAttendanceReminderThreshold;
    const candidates = attendance.filter(item => item.raidNightsAttended >= threshold);
    const today = toLocalDateKey(new Date());

    let remindersSent = 0;
    let remindersSkippedAsDuplicate = 0;
    let deliveryFailures = 0;

    for (const candidate of candidates) {
        const existingReminder = await context.prisma.attendanceReminderLog.findUnique({
            where: {
                guildId_trialId_userId_reminderDate: {
                    guildId,
                    trialId: candidate.trialId,
                    userId: candidate.userId,
                    reminderDate: today,
                },
            },
        });

        if (existingReminder) {
            remindersSkippedAsDuplicate += 1;
            continue;
        }

        const displayName = await resolveGuildDisplayName(
            context.client,
            guildId,
            candidate.userId,
            candidate.userId,
        );

        const embed = buildRaidAttendanceReminderEmbed({
            displayName,
            userId: candidate.userId,
            trialId: candidate.trialId,
            raidNightsAttended: candidate.raidNightsAttended,
            threshold,
        });

        const sendResult = await sendOfficerChannelMessage(context.client, settings.officerChannelId, {
            embeds: [embed.toJSON()],
        });

        if (!sendResult.delivered) {
            deliveryFailures += 1;
            continue;
        }

        await context.prisma.attendanceReminderLog.create({
            data: {
                guildId,
                trialId: candidate.trialId,
                userId: candidate.userId,
                reminderDate: today,
                attendanceCount: candidate.raidNightsAttended,
            },
        });

        remindersSent += 1;
    }

    return {
        guildId,
        skipped: false,
        candidatesEvaluated: candidates.length,
        remindersSent,
        remindersSkippedAsDuplicate,
        deliveryFailures,
    };
}

export async function runRaidAttendanceReminderCycleForAllGuilds(
    context: AppContext,
): Promise<RaidAttendanceReminderRunResult[]> {
    const guildSettings = await context.prisma.settings.findMany({
        where: {
            raidScheduleCron: {
                not: null,
            },
            raidAttendanceReminderThreshold: {
                not: null,
            },
        },
        select: {
            guildId: true,
        },
    });

    const results: RaidAttendanceReminderRunResult[] = [];

    for (const setting of guildSettings) {
        try {
            const result = await runGuildRaidAttendanceReminderCycle(context, setting.guildId);
            results.push(result);
        } catch (error) {
            console.error(`Raid reminder cycle failed for guild ${setting.guildId}:`, error);
            results.push({
                guildId: setting.guildId,
                skipped: false,
                candidatesEvaluated: 0,
                remindersSent: 0,
                remindersSkippedAsDuplicate: 0,
                deliveryFailures: 1,
            });
        }
    }

    return results;
}
