import type { GatewayGuildScheduledEventUserRemoveDispatchData } from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { AttendeeSource } from '../structs/database.js'

export async function handle_guild_scheduled_event_user_remove(
  context: Context,
  payload: GatewayGuildScheduledEventUserRemoveDispatchData,
) {
  const { guild_scheduled_event_id, user_id } = payload

  await context.database.remove_attendee(
    guild_scheduled_event_id,
    user_id,
    AttendeeSource.Discord,
  )

  context.cache.remove_identifier(guild_scheduled_event_id, user_id)
}
