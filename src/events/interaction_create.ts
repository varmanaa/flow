import {
  type APIChatInputApplicationCommandInteractionData,
  type APIEmbed,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type GatewayInteractionCreateDispatchData,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'
import {
  handle_event_autocomplete,
  handle_event_command,
  handle_show_attendees_command,
  handle_view_attendees_command,
} from '../interactions/index.js'
import type { Context } from '../structs/context.js'

export interface ChatInputAutocompleteInteraction {
  data: APIChatInputApplicationCommandInteractionData &
    Required<Pick<APIChatInputApplicationCommandInteractionData, 'options'>>
  guild_id: string
  id: string
  token: string
}

export interface ChatInputCommandInteraction {
  data: APIChatInputApplicationCommandInteractionData
  guild_id: string
  id: string
  subcommand: string | null
  token: string
}

async function handle_application_command(
  context: Context,
  interaction: ChatInputCommandInteraction,
) {
  const command_name = interaction.data.name

  switch (command_name) {
    case 'event': {
      await handle_event_command(context, interaction)
      break
    }
    case 'show-attendees': {
      await handle_show_attendees_command(context, interaction)
      break
    }
    case 'view-attendees': {
      await handle_view_attendees_command(context, interaction)
      break
    }
    default: {
      const embed: Partial<APIEmbed> = {
        color: 0xf8f8ff,
        description: `I don\'t have a command with the name \"${command_name}\".`,
      }

      await context.api.interactions.reply(interaction.id, interaction.token, {
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      })
    }
  }
}

async function handle_application_command_autocomplete(
  context: Context,
  interaction: ChatInputAutocompleteInteraction,
) {
  const focused_name = interaction.data.options.find(
    option => 'focused' in option && Boolean(option.focused),
  )?.name

  switch (focused_name) {
    case 'event': {
      await handle_event_autocomplete(context, interaction)
      break
    }
  }
}

export async function handle_interaction_create(
  context: Context,
  payload: GatewayInteractionCreateDispatchData,
) {
  if (!Reflect.has(payload, 'guild_id')) {
    const embed: Partial<APIEmbed> = {
      color: 0xf8f8ff,
      description: 'Please kick and re-invite me.',
    }

    await context.api.interactions.reply(payload.id, payload.token, {
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    })
  }

  const guild_id = payload.guild_id as string

  if (
    payload.type === InteractionType.ApplicationCommand &&
    payload.data.type === ApplicationCommandType.ChatInput
  ) {
    const interaction: ChatInputCommandInteraction = {
      data: payload.data,
      guild_id,
      id: payload.id,
      subcommand: null,
      token: payload.token,
    }

    if (
      interaction.data?.options?.[0]?.type ===
      ApplicationCommandOptionType.Subcommand
    ) {
      interaction.subcommand = interaction.data.options[0].name
      interaction.data.options = interaction.data.options[0].options ?? []
    }

    await handle_application_command(context, interaction)
  } else if (
    payload.type === InteractionType.ApplicationCommandAutocomplete &&
    payload.data.type === ApplicationCommandType.ChatInput
  ) {
    const interaction: ChatInputAutocompleteInteraction = {
      data: payload.data,
      guild_id,
      id: payload.id,
      token: payload.token,
    }

    if (
      interaction.data?.options?.[0]?.type ===
      ApplicationCommandOptionType.Subcommand
    )
      interaction.data.options = interaction.data.options[0].options ?? []

    await handle_application_command_autocomplete(context, interaction)
  } else {
    const embed: Partial<APIEmbed> = {
      color: 0xf8f8ff,
      description: "I don't recognize this interaction.",
    }

    await context.api.interactions.reply(payload.id, payload.token, {
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    })
  }
}
