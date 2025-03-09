import type { GatewayGuildScheduledEventUserAddDispatchData } from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { AttendeeSource } from '../structs/database.js'

export async function handle_guild_scheduled_event_user_add(
  context: Context,
  payload: GatewayGuildScheduledEventUserAddDispatchData,
) {
  const { guild_scheduled_event_id, user_id } = payload

  await context.database.insert_attendee(
    guild_scheduled_event_id,
    user_id,
    AttendeeSource.Discord,
  )

  context.cache.insert_identifier(guild_scheduled_event_id, user_id)
}
