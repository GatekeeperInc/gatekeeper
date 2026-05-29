import type { SapphireClient } from "@sapphire/framework";
import type { EmbedBuilder } from "discord.js";
import {
	buildHelpEmbed,
	type HelpCommandReference,
	type HelpEmbedSection,
} from "./embedBuilders.js";
import { createGuildLogger } from "./logger.js";

const DOCS_URL = "https://gatekeeper-bot.com/commands/";
const SUPPORT_URL = "https://github.com/GatekeeperInc/gatekeeper/issues";

export type HelpCategory = "trial-lifecycle" | "feedback" | "admin" | "utility";

export const HELP_CATEGORY_CHOICES: Array<{ name: string; value: HelpCategory }> =
	[
		{ name: "Trial lifecycle", value: "trial-lifecycle" },
		{ name: "Feedback", value: "feedback" },
		{ name: "Admin", value: "admin" },
		{ name: "Utility", value: "utility" },
	];

const HELP_CATEGORY_LABELS: Record<HelpCategory, string> = {
	"trial-lifecycle": "Trial lifecycle",
	feedback: "Feedback",
	admin: "Admin",
	utility: "Utility",
};

const HELP_CATEGORY_COMMANDS: Record<HelpCategory, HelpCommandReference[]> = {
	"trial-lifecycle": [
		{
			name: "start",
			description: "Start a member trial",
		},
		{
			name: "pass",
			description: "Mark a trial as passed",
		},
		{
			name: "fail",
			description: "Mark a trial as failed",
		},
		{
			name: "vote",
			description: "Create a trial vote poll for a member",
		},
	],
	feedback: [
		{
			name: "feedback",
			description: "Submit officer feedback for an active trial",
		},
		{
			name: "trials-feedback",
			description: "Open quick feedback actions for active trials",
		},
		{
			name: "summary",
			description: "Show trial feedback summary for a member",
		},
	],
	admin: [
		{
			name: "settings",
			description: "Configure guild trial settings",
		},
		{
			name: "reminders",
			description: "Run raid attendance reminder tools",
			usage: "run-now",
		},
		{
			name: "roledebug",
			description: "Inspect role and hierarchy troubleshooting data",
		},
	],
	utility: [
		{
			name: "list",
			description: "List trials for this guild",
		},
		{
			name: "ping",
			description: "Check bot latency and heartbeat",
		},
		{
			name: "help",
			description: "Show command help with optional category filter",
		},
	],
};

export type HelpWorkflowResult = {
	embeds: EmbedBuilder[];
};

export function isHelpCategory(value: string): value is HelpCategory {
	return Object.hasOwn(HELP_CATEGORY_COMMANDS, value);
}

export async function runHelpWorkflow(input: {
	client: SapphireClient;
	guildId: string;
	actorId: string;
	category?: HelpCategory;
}): Promise<HelpWorkflowResult> {
	const log = createGuildLogger(input.guildId);
	const selectedLabel = input.category
		? HELP_CATEGORY_LABELS[input.category]
		: undefined;

	const sections: HelpEmbedSection[] = input.category
		? [
				{
					title: selectedLabel ?? "Commands",
					commands: HELP_CATEGORY_COMMANDS[input.category],
				},
			]
		: HELP_CATEGORY_CHOICES.map((choice) => ({
				title: choice.name,
				commands: HELP_CATEGORY_COMMANDS[choice.value],
			}));

	const logoUrl = input.client.user?.displayAvatarURL({
		extension: "png",
		size: 256,
	});

	log.info(
		{ actorId: input.actorId, category: input.category ?? "all" },
		"Help command invoked.",
	);

	return {
		embeds: [
			buildHelpEmbed(
				{
					sections,
					docsUrl: DOCS_URL,
					supportUrl: SUPPORT_URL,
					...(selectedLabel
						? { selectedCategoryLabel: selectedLabel }
						: {}),
				},
				logoUrl,
			),
		],
	};
}
