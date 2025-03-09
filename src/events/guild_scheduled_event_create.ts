import {
  type GatewayGuildScheduledEventCreateDispatchData,
  GuildScheduledEventStatus,
} from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { EventStatus } from '../structs/database.js'

export async function handle_guild_scheduled_event_create(
  context: Context,
  payload: GatewayGuildScheduledEventCreateDispatchData,
) {
  const {
    description = '',
    id,
    guild_id,
    name,
    scheduled_start_time,
    status,
  } = payload
  const lowered_event_name_and_description =
    `${name}${description}`.toLowerCase()

  let waitlist_threshold = null

  if (lowered_event_name_and_description.includes('twilight'))
    waitlist_threshold = 24
  else if (lowered_event_name_and_description.includes('ftw'))
    waitlist_threshold = 28
  else if (lowered_event_name_and_description.includes('midori'))
    waitlist_threshold = 32

  switch (status) {
    case GuildScheduledEventStatus.Scheduled: {
      await context.database.upsert_event(
        id,
        guild_id,
        name,
        scheduled_start_time,
        EventStatus.Scheduled,
        waitlist_threshold,
      )

      break
    }
    case GuildScheduledEventStatus.Active: {
      await context.database.upsert_event(
        id,
        guild_id,
        name,
        scheduled_start_time,
        EventStatus.Active,
        waitlist_threshold,
      )

      break
    }
  }

  const cached_event = await context.database.event(id)

  if (cached_event) context.cache.insert_event(cached_event)
}
