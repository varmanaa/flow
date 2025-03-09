import {
  type APIEmbed,
  ApplicationCommandOptionType,
  MessageFlags,
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction } from '../../events/interaction_create.js'
import type { Context } from '../../structs/context.js'

export async function handle_view_attendees_command(
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

  const { list, waitlist } = await context.database.attendees(event.id)

  embed.title = `${event.label} attendees`
  embed.timestamp = new Date().toISOString()

  if (!list.length) embed.description = 'There are no attendees for this event.'
  else {
    embed.description = list.join('\n')

    if (waitlist.length)
      embed.fields = [{ name: 'Waitlist', value: waitlist.join('\n') }]
  }

  await context.api.interactions.editReply(
    context.application_id,
    interaction.token,
    { embeds: [embed] },
  )
}
