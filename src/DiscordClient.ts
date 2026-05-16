import { Client } from "discord.js";

import * as fs from 'node:fs';
import * as path from 'node:path';

import { fileURLToPath, pathToFileURL } from "node:url";


export class DiscordClient extends Client {
    commands: Map<string, any>;  // Or Collection<string, any>

    constructor(options: any) {
        super(options);
        this.commands = new Map<string, any>();  // Initialize here
    }

    async loadCommands() {
        const commandsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'commands');
        const commandFiles = await fs.promises.readdir(commandsPath);
        const filteredFiles = commandFiles.filter(file => file.endsWith('.ts') || file.endsWith('.js'));

        for (const file of filteredFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const commandModule = await import(pathToFileURL(filePath).href);
                const command = commandModule.default ?? commandModule;

                if (command.data?.name && command.execute) {
                    this.commands.set(command.data.name, command);
                    console.log(`Loaded command: ${command.data.name}`);
                } else {
                    console.warn(`Skipping invalid command file: ${file}`);
                }
            } catch (error) {
                console.error(`Error loading command ${file}:`, error);
            }
        }
    }

    async loadEvents() {
        const eventsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'events');
        const eventFiles = await fs.promises.readdir(eventsPath);
        const filteredFiles = eventFiles.filter(file => file.endsWith('.ts') || file.endsWith('.js'));

        for (const file of filteredFiles) {
            const filePath = path.join(eventsPath, file);
            try {
                const eventModule = await import(pathToFileURL(filePath).href);
                const event = eventModule.default ?? eventModule;

                if (event.name && typeof event.execute === 'function') {
                    if (event.once) {
                        this.once(event.name, (...args) => event.execute(...args, this));
                    } else {
                        this.on(event.name, (...args) => event.execute(...args, this));
                    }
                    console.log(`Loaded event: ${event.name}`);
                } else {
                    console.warn(`Skipping invalid event file: ${file}`);
                }
            } catch (error) {
                console.error(`Error loading event ${file}:`, error);
            }
        }
    }
}
