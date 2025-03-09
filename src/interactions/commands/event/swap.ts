import {
  type APIEmbed,
  ApplicationCommandOptionType,
  MessageFlags,
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction } from '../../../events/interaction_create.js'
import type { Context } from '../../../structs/context.js'

export async function handle_swap_command(
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

  const attendee_count = event.lower_identifiers.size

  if (attendee_count < 2) {
    embed.description =
      'There are fewer than two attendees for this event and no person may be swapped.'

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }

  const position_one_option = interaction.data.options?.find(
    option =>
      option.name === 'position-one' &&
      option.type === ApplicationCommandOptionType.Integer,
  )
  const position_one_value =
    position_one_option &&
    'value' in position_one_option &&
    typeof position_one_option.value === 'number'
      ? position_one_option.value
      : 0
  if (position_one_value === 0 || position_one_value > attendee_count) {
    embed.description = `Provide an integer between 1 and ${attendee_count} for the "position-one" option.`

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }

  const position_two_option = interaction.data.options?.find(
    option =>
      option.name === 'position-two' &&
      option.type === ApplicationCommandOptionType.Integer,
  )
  const position_two_value =
    position_two_option &&
    'value' in position_two_option &&
    typeof position_two_option.value === 'number'
      ? position_two_option.value
      : 0
  if (position_two_value === 0 || position_two_value > attendee_count) {
    embed.description = `Provide an integer between 1 and ${attendee_count} for the "position-two" option.`

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }
  if (position_one_value === position_two_value) {
    embed.description =
      'Provide different integers for both the "position-one" and "position-two" options.'

    await context.api.interactions.editReply(
      context.application_id,
      interaction.token,
      {
        embeds: [embed],
      },
    )

    return
  }

  await context.database.swap_attendee_positions(
    event.id,
    position_one_value,
    position_two_value,
  )

  const { list, waitlist } = await context.database.attendees(event.id)

  embed.title = `${event.label} attendees`
  embed.timestamp = new Date().toISOString()

  if (!list.length) embed.description = 'There are no attendees for this event.'
  else {
    const waitlist_threshold = event.waitlist_threshold ?? attendee_count

    if (position_one_value <= waitlist_threshold)
      list[position_one_value - 1] += ' ⬅️'
    else waitlist[position_one_value - waitlist_threshold - 1] += ' ⬅️'

    if (position_two_value <= waitlist_threshold)
      list[position_two_value - 1] += ' ⬅️'
    else waitlist[position_two_value - waitlist_threshold - 1] += ' ⬅️'

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
