import type { Feedback, PrismaClient } from '../generated/prisma/client.js';

const FEEDBACK_MODAL_PREFIX = 'feedbackModal';

export function buildFeedbackModalCustomId(trialId: number, targetId: string): string {
    return `${FEEDBACK_MODAL_PREFIX}:${trialId}:${targetId}`;
}

export function parseFeedbackModalCustomId(customId: string): {
    trialId: number;
    targetId: string;
} | null {
    if (!customId.startsWith(`${FEEDBACK_MODAL_PREFIX}:`)) {
        return null;
    }

    const parts = customId.split(':');
    if (parts.length !== 3) {
        return null;
    }

    const trialId = Number(parts[1]);
    const targetId = parts[2];
    if (!Number.isInteger(trialId) || trialId <= 0 || !targetId) {
        return null;
    }

    return { trialId, targetId };
}

type CreateFeedbackInput = {
    guildId: string;
    trialId: number;
    targetId: string;
    officerId: string;
    performance: number;
    attitude: number;
    focus: number;
    late: boolean;
    comments?: string | undefined;
};

type FeedbackAverages = {
    performance: number;
    attitude: number;
    focus: number;
};

export type MemberFeedbackSummary = {
    trialId: number;
    feedbackCount: number;
    averages: FeedbackAverages;
    lateCount: number;
    recentComments: string[];
};

export type MemberFeedbackSummaryResult =
    | { outcome: 'no_active_trial' }
    | { outcome: 'no_feedback'; trialId: number }
    | { outcome: 'summary'; summary: MemberFeedbackSummary };

function roundToSingleDecimal(value: number): number {
    return Number(value.toFixed(1));
}

function calculateAverages(feedbacks: Feedback[]): FeedbackAverages {
    const count = feedbacks.length;
    const performanceTotal = feedbacks.reduce((total, feedback) => total + feedback.performance, 0);
    const attitudeTotal = feedbacks.reduce((total, feedback) => total + feedback.attitude, 0);
    const focusTotal = feedbacks.reduce((total, feedback) => total + feedback.focus, 0);

    return {
        performance: roundToSingleDecimal(performanceTotal / count),
        attitude: roundToSingleDecimal(attitudeTotal / count),
        focus: roundToSingleDecimal(focusTotal / count),
    };
}

export async function getMemberFeedbackSummary(
    prisma: PrismaClient,
    guildId: string,
    userId: string,
): Promise<MemberFeedbackSummaryResult> {
    const activeTrial = await prisma.trial.findFirst({
        where: {
            guildId,
            userId,
            active: true,
        },
    });

    if (!activeTrial) {
        return { outcome: 'no_active_trial' };
    }

    const feedbacks = await prisma.feedback.findMany({
        where: {
            guildId,
            trialId: activeTrial.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (feedbacks.length === 0) {
        return { outcome: 'no_feedback', trialId: activeTrial.id };
    }

    const lateCount = feedbacks.filter(feedback => feedback.late).length;
    const recentComments = feedbacks
        .map(feedback => feedback.comments?.trim() ?? '')
        .filter(comment => comment.length > 0)
        .slice(0, 3);

    return {
        outcome: 'summary',
        summary: {
            trialId: activeTrial.id,
            feedbackCount: feedbacks.length,
            averages: calculateAverages(feedbacks),
            lateCount,
            recentComments,
        },
    };
}

export async function createFeedback(
    prisma: PrismaClient,
    input: CreateFeedbackInput,
): Promise<{ created: boolean; feedback?: Feedback; reason?: 'trial_not_found' | 'trial_not_active' }> {
    const trial = await prisma.trial.findFirst({
        where: {
            id: input.trialId,
            guildId: input.guildId,
            userId: input.targetId,
        },
    });

    if (!trial) {
        return { created: false, reason: 'trial_not_found' };
    }

    if (!trial.active) {
        return { created: false, reason: 'trial_not_active' };
    }

    const feedback = await prisma.feedback.create({
        data: {
            guildId: input.guildId,
            trialId: input.trialId,
            officerId: input.officerId,
            performance: input.performance,
            attitude: input.attitude,
            focus: input.focus,
            late: input.late,
            comments: input.comments ?? null,
        },
    });

    return { created: true, feedback };
}
