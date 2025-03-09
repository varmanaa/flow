import type { GatewayGuildScheduledEventDeleteDispatchData } from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { EventStatus } from '../structs/database.js'

export async function handle_guild_scheduled_event_delete(
  context: Context,
  payload: GatewayGuildScheduledEventDeleteDispatchData,
) {
  const { id } = payload

  await context.database.update_event(id, {
    status: EventStatus.Canceled,
  })

  context.cache.remove_event(id)
}
