import {
  type APIEmbed,
  ApplicationCommandOptionType,
  MessageFlags,
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction } from '../../../events/interaction_create.js'
import type { Context } from '../../../structs/context.js'
import { AttendeeSource } from '../../../structs/database.js'

export async function handle_remove_name_command(
  context: Context,
  interaction: ChatInputCommandInteraction,
) {
  await context.api.interactions.defer(interaction.id, interaction.token, {
    flags: MessageFlags.Ephemeral,
  })

  const event_option = interaction.data.options?.find(
    option =>
      option.name === 'event' &&
      option.type === ApplicationCommandOptionType.String,
  )
  const event_value =
    event_option && 'value' in event_option ? event_option.value.toString() : ''
  const event = context.cache.event(event_value)
  const embed: Partial<APIEmbed> = { color: 0xf8f8ff }

  if (!event) {
    embed.description = "I don't recognize this event."

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }

  const name_option = interaction.data.options?.find(
    option =>
      option.name === 'name' &&
      option.type === ApplicationCommandOptionType.String,
  )
  const name_value =
    name_option &&
    'value' in name_option &&
    typeof name_option.value === 'string'
      ? name_option.value.trim()
      : ''

  if (name_value.length < 2) {
    embed.description =
      'Names must be at least 2 characters and at most 32 characters long.'

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }
  if (/^\d+$/.test(name_value)) {
    embed.description =
      'Names must not contain only digits.'

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }

  const lower_name_value = name_value.toLocaleLowerCase()
  const is_lower_name_value_used = event.lower_identifiers.has(lower_name_value)

  if (!is_lower_name_value_used) {
    embed.description = `**${name_value}** is not in the "${event.label}" attendee list.`
  } else {
    await context.database.remove_attendee(
      event.id,
      name_value,
      AttendeeSource.Named,
    )

    context.cache.remove_identifier(event.id, lower_name_value)

    embed.description = `I've removed **${name_value}** from the "${event.label}" attendee list.`
  }

  await context.api.interactions.editReply(
    context.application_id,
    interaction.token,
    {
      embeds: [embed],
    },
  )
}
