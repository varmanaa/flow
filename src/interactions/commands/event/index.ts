import { type APIEmbed, MessageFlags } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction } from '../../../events/interaction_create.js'
import type { Context } from '../../../structs/context.js'
import { handle_add_name_command } from './add_name.js'
import { handle_remove_name_command } from './remove_name.js'
import { handle_set_waitlist_threshold_command } from './set_waitlist_threshold.js'
import { handle_swap_command } from './swap.js'

export async function handle_event_command(
  context: Context,
  interaction: ChatInputCommandInteraction,
) {
  switch (interaction.subcommand) {
    case 'add-name': {
      await handle_add_name_command(context, interaction)
      break
    }
    case 'remove-name': {
      await handle_remove_name_command(context, interaction)
      break
    }
    case 'set-waitlist-threshold': {
      await handle_set_waitlist_threshold_command(context, interaction)
      break
    }
    case 'swap': {
      await handle_swap_command(context, interaction)
      break
    }
    default: {
      const embed: Partial<APIEmbed> = {
        color: 0xf8f8ff,
        description: `I don\'t have a subcommand with the name \"${interaction.subcommand}\".`,
      }

      await context.api.interactions.editReply(
        interaction.id,
        interaction.token,
        {
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        },
      )
    }
  }
}
