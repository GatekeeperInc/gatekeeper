import { type ApplicationCommandRegistry, Command } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import {
	HELP_CATEGORY_CHOICES,
	isHelpCategory,
	runHelpWorkflow,
} from "../services/helpService.js";

export class HelpCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			name: "help",
			description: "Shows command help with optional category filtering",
			preconditions: ["OfficerOnly"],
		});
	}

	public override registerApplicationCommands(
		registry: ApplicationCommandRegistry,
	) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option
						.setName("category")
						.setDescription("Filter help output to one command category")
						.setRequired(false)
						.addChoices(...HELP_CATEGORY_CHOICES),
				),
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId) {
			await interaction.reply({
				content: "This command can only be used in a server.",
				flags: ["Ephemeral"],
			});
			return;
		}

		const categoryValue = interaction.options.getString("category");
		const category =
			categoryValue && isHelpCategory(categoryValue) ? categoryValue : undefined;

		const workflowInput = {
			client: this.container.client,
			guildId: interaction.guildId,
			actorId: interaction.user.id,
			...(category ? { category } : {}),
		};

		const workflowResult = await runHelpWorkflow(workflowInput);

		await interaction.reply({
			embeds: workflowResult.embeds,
			flags: ["Ephemeral"],
		});
	}
}
