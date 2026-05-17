import type { PrismaClient, Trial } from '../generated/prisma/client.js';

export async function findActiveTrial(
    prisma: PrismaClient,
    guildId: string,
    userId: string,
): Promise<Trial | null> {
    return prisma.trial.findFirst({
        where: {
            guildId,
            userId,
            active: true,
        },
    });
}

export async function startTrial(
    prisma: PrismaClient,
    guildId: string,
    userId: string,
    startedById: string,
): Promise<{ created: boolean; trial?: Trial }> {
    const existingTrial = await findActiveTrial(prisma, guildId, userId);
    if (existingTrial) {
        return { created: false, trial: existingTrial };
    }

    const trial = await prisma.trial.create({
        data: {
            guildId,
            userId,
            startedById,
            active: true,
            startTime: new Date(),
        },
    });

    return { created: true, trial };
}

export async function resolveTrial(
    prisma: PrismaClient,
    guildId: string,
    userId: string,
    passed: boolean,
): Promise<{ updated: boolean; trialId?: number }> {
    const activeTrial = await findActiveTrial(prisma, guildId, userId);
    if (!activeTrial) {
        return { updated: false };
    }

    await prisma.trial.update({
        where: { id: activeTrial.id },
        data: {
            active: false,
            passed,
        },
    });

    return { updated: true, trialId: activeTrial.id };
}

export async function listTrials(
    prisma: PrismaClient,
    guildId: string,
    active: boolean,
): Promise<Trial[]> {
    return prisma.trial.findMany({
        where: {
            guildId,
            active,
        },
        orderBy: {
            startTime: 'desc',
        },
    });
}
