import {
  type APIEmbed,
  ApplicationCommandOptionType,
  MessageFlags,
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction } from '../../../events/interaction_create.js'
import type { Context } from '../../../structs/context.js'

export async function handle_set_waitlist_threshold_command(
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

  const threshold_option = interaction.data.options?.find(
    option =>
      option.name === 'threshold' &&
      option.type === ApplicationCommandOptionType.Integer,
  )
  const threshold_value =
    threshold_option &&
    'value' in threshold_option &&
    typeof threshold_option.value === 'number'
      ? threshold_option.value
      : null

  if (threshold_value === event.waitlist_threshold) {
    embed.description = 'No change has been made.'

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }

  await context.database.update_event(event.id, {
    waitlist_threshold: threshold_value,
  })

  context.cache.update_waitlist_threshold(event.id, threshold_value)

  embed.description =
    threshold_value === null
      ? `There is now no waitlist threshold for "${event.label}".`
      : `The waitlist threshold for "${event.label}" is now **${threshold_value}**.`

  await context.api.interactions.editReply(
    context.application_id,
    interaction.token,
    {
      embeds: [embed],
    },
  )
}
