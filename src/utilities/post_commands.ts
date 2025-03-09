import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionContextType,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10'

import { API } from '@discordjs/core'
import { REST } from '@discordjs/rest'
import {
  type RESTGetCurrentApplicationResult,
  Routes,
} from 'discord-api-types/v10'

import { DISCORD_TOKEN } from './constants.js'

const COMMANDS: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  {
    contexts: [InteractionContextType.Guild],
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    description: 'Manage events',
    name: 'event',
    options: [
      {
        description: "Add a name to an event's attendance list",
        name: 'add-name',

        options: [
          {
            autocomplete: true,
            description: 'The event to add to',
            name: 'event',
            required: true,
            type: ApplicationCommandOptionType.String,
          },
          {
            name: 'name',
            description: 'The name to add',
            max_length: 32,
            min_length: 2,
            required: true,
            type: ApplicationCommandOptionType.String,
          },
        ],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        description: "Remove a name from an event's attendance list",
        name: 'remove-name',

        options: [
          {
            autocomplete: true,
            description: 'The event to remove from',
            name: 'event',
            required: true,
            type: ApplicationCommandOptionType.String,
          },
          {
            name: 'name',
            description: 'The name to remove',
            max_length: 32,
            min_length: 2,
            required: true,
            type: ApplicationCommandOptionType.String,
          },
        ],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        description: 'Set the waitlist threshold for an event',
        name: 'set-waitlist-threshold',

        options: [
          {
            autocomplete: true,
            description: 'The event to set the threshold for',
            name: 'event',
            required: true,
            type: ApplicationCommandOptionType.String,
          },
          {
            description: 'The waitlist threshold',
            name: 'threshold',
            max_value: 100,
            min_value: 1,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        description: 'Swap two positions in an event',
        name: 'swap',

        options: [
          {
            autocomplete: true,
            description: 'The event to swap in',
            name: 'event',
            required: true,
            type: ApplicationCommandOptionType.String,
          },
          {
            description: 'The first position',
            name: 'position-one',
            max_value: 100,
            min_value: 1,
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
          {
            description: 'The second position',
            name: 'position-two',
            max_value: 100,
            min_value: 1,
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
    type: ApplicationCommandType.ChatInput,
  },
  {
    contexts: [InteractionContextType.Guild],
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    description: 'Show the attendance for an event',
    name: 'show-attendees',
    options: [
      {
        autocomplete: true,
        description: 'The event to show attendance for',
        name: 'event',
        required: true,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  {
    contexts: [InteractionContextType.Guild],
    description: 'View the attendance for an event',
    name: 'view-attendees',
    options: [
      {
        autocomplete: true,
        description: 'The event to view attendance for',
        name: 'event',
        required: true,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
]

const rest = new REST().setToken(DISCORD_TOKEN)
const api = new API(rest)
const current_application = (await rest.get(
  Routes.currentApplication(),
)) as RESTGetCurrentApplicationResult
const application_id = current_application.id
const result = await api.applicationCommands.bulkOverwriteGlobalCommands(
  application_id,
  COMMANDS,
)

console.log(
  `I've overwrote all commands with the ${result.length} commands defined in "constants.ts".`,
)
