import {
  GatewayDispatchEvents,
  type GatewayDispatchPayload,
} from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { handle_guild_create } from './guild_create.js'
import { handle_guild_delete } from './guild_delete.js'
import { handle_guild_scheduled_event_create } from './guild_scheduled_event_create.js'
import { handle_guild_scheduled_event_delete } from './guild_scheduled_event_delete.js'
import { handle_guild_scheduled_event_update } from './guild_scheduled_event_update.js'
import { handle_guild_scheduled_event_user_add } from './guild_scheduled_event_user_add.js'
import { handle_guild_scheduled_event_user_remove } from './guild_scheduled_event_user_remove.js'
import { handle_interaction_create } from './interaction_create.js'
import { handle_ready } from './ready.js'

export async function handle_event(
  context: Context,
  event: GatewayDispatchPayload,
) {
  switch (event.t) {
    case GatewayDispatchEvents.GuildCreate: {
      handle_guild_create(context, event.d)
      break
    }
    case GatewayDispatchEvents.GuildDelete: {
      handle_guild_delete(context, event.d)
      break
    }
    case GatewayDispatchEvents.GuildScheduledEventCreate: {
      handle_guild_scheduled_event_create(context, event.d)
      break
    }
    case GatewayDispatchEvents.GuildScheduledEventDelete: {
      handle_guild_scheduled_event_delete(context, event.d)
      break
    }
    case GatewayDispatchEvents.GuildScheduledEventUpdate: {
      handle_guild_scheduled_event_update(context, event.d)
      break
    }
    case GatewayDispatchEvents.GuildScheduledEventUserAdd: {
      handle_guild_scheduled_event_user_add(context, event.d)
      break
    }
    case GatewayDispatchEvents.GuildScheduledEventUserRemove: {
      handle_guild_scheduled_event_user_remove(context, event.d)
      break
    }
    case GatewayDispatchEvents.InteractionCreate: {
      handle_interaction_create(context, event.d)
      break
    }
    case GatewayDispatchEvents.Ready: {
      handle_ready(context, event.d)
      break
    }
  }
}
