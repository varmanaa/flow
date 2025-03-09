import type { GatewayGuildDeleteDispatchData } from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { EventStatus } from '../structs/database.js'

export async function handle_guild_delete(
  context: Context,
  payload: GatewayGuildDeleteDispatchData,
) {
  if (payload?.unavailable) return

  const guild_event_ids = context.cache.guild_event_ids(payload.id)

  for (const guild_event_id of guild_event_ids) {
    await context.database.update_event(guild_event_id, {
      status: EventStatus.Unknown,
    })

    context.cache.remove_event(guild_event_id)
  }
}
