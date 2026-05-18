import cron, { type ScheduledTask } from 'node-cron';
import type { AppContext } from '../types.js';
import { findGuildSettings } from './guildSettings.js';
import { runGuildRaidAttendanceReminderCycle } from './raidAttendanceReminderService.js';

const guildSchedules = new Map<string, ScheduledTask>();

function stopGuildSchedule(guildId: string): void {
    const task = guildSchedules.get(guildId);
    if (!task) {
        return;
    }

    task.stop();
    task.destroy();
    guildSchedules.delete(guildId);
}

function registerGuildSchedule(context: AppContext, guildId: string, cronExpression: string): void {
    const task = cron.schedule(cronExpression, async () => {
        const result = await runGuildRaidAttendanceReminderCycle(context, guildId);

        if (result.skipped) {
            console.log(`Raid reminder skipped for guild ${guildId}: ${result.skippedReason ?? 'unknown'}`);
            return;
        }

        console.log(
            `Raid reminder run for guild ${guildId}: candidates=${result.candidatesEvaluated}, sent=${result.remindersSent}, duplicate=${result.remindersSkippedAsDuplicate}, failures=${result.deliveryFailures}`,
        );
    });

    guildSchedules.set(guildId, task);
}

export async function refreshGuildRaidReminderSchedule(context: AppContext, guildId: string): Promise<void> {
    stopGuildSchedule(guildId);

    const settings = await findGuildSettings(context.prisma, guildId);
    if (!settings || !settings.raidScheduleCron || !settings.raidAttendanceReminderThreshold) {
        return;
    }

    if (!cron.validate(settings.raidScheduleCron)) {
        console.warn(`Skipping invalid raid schedule for guild ${guildId}: ${settings.raidScheduleCron}`);
        return;
    }

    registerGuildSchedule(context, guildId, settings.raidScheduleCron);
}

export async function startRaidReminderScheduler(context: AppContext): Promise<void> {
    const allSettings = await context.prisma.settings.findMany({
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
            raidScheduleCron: true,
        },
    });

    let registered = 0;
    for (const setting of allSettings) {
        if (!setting.raidScheduleCron || !cron.validate(setting.raidScheduleCron)) {
            continue;
        }

        registerGuildSchedule(context, setting.guildId, setting.raidScheduleCron);
        registered += 1;
    }

    console.log(`Raid reminder scheduler initialized with ${registered} guild schedule(s).`);
}
