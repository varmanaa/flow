import {
  type APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
} from 'discord-api-types/v10'
import type { ChatInputAutocompleteInteraction } from '../../events/interaction_create.js'
import type { Context } from '../../structs/context.js'

export async function handle_event_autocomplete(
  context: Context,
  interaction: ChatInputAutocompleteInteraction,
) {
  const choices: APIApplicationCommandOptionChoice<string>[] = []
  const event_option = interaction.data.options.find(
    option =>
      'focused' in option &&
      Boolean(option.focused) &&
      option.name === 'event' &&
      option.type === ApplicationCommandOptionType.String,
  )

  if (event_option && 'value' in event_option) {
    const lowercased_value: string = event_option.value
      .toString()
      .toLocaleLowerCase()
    const guild_event_ids = context.cache.guild_event_ids(interaction.guild_id)

    for (const guild_event_id of guild_event_ids) {
      const event = context.cache.event(guild_event_id)

      if (event?.label.toLocaleLowerCase().includes('staff')) continue
      if (!event?.label.toLocaleLowerCase().includes(lowercased_value)) continue

      choices.push({
        name: event.label,
        value: event.id,
      })

      if (choices.length >= 25) break
    }

    choices.sort((a, b) => a.name.localeCompare(b.name))
  }

  await context.api.interactions.createAutocompleteResponse(
    interaction.id,
    interaction.token,
    { choices },
  )
}
