import {
  type GatewayGuildCreateDispatchData,
  GuildScheduledEventStatus,
} from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { AttendeeSource, EventStatus } from '../structs/database.js'

export async function handle_guild_create(
  context: Context,
  payload: GatewayGuildCreateDispatchData,
) {
  const { id: guild_id } = payload
  const event_ids: string[] = []

  for (const guild_scheduled_event of payload.guild_scheduled_events) {
    const {
      description = '',
      id,
      name,
      scheduled_start_time,
      status,
    } = guild_scheduled_event

    event_ids.push(id)

    let formatted_status: EventStatus

    if (status === GuildScheduledEventStatus.Active)
      formatted_status = EventStatus.Active
    else if (status === GuildScheduledEventStatus.Canceled)
      formatted_status = EventStatus.Canceled
    else if (status === GuildScheduledEventStatus.Completed)
      formatted_status = EventStatus.Completed
    else if (status === GuildScheduledEventStatus.Scheduled)
      formatted_status = EventStatus.Scheduled
    else formatted_status = EventStatus.Unknown

    const lowered_event_name_and_description =
      `${name}${description}`.toLowerCase()

    let waitlist_threshold = null

    if (lowered_event_name_and_description.includes('twilight'))
      waitlist_threshold = 24
    else if (lowered_event_name_and_description.includes('ftw'))
      waitlist_threshold = 28
    else if (lowered_event_name_and_description.includes('midori'))
      waitlist_threshold = 32

    await context.database.upsert_event(
      id,
      guild_id,
      name,
      scheduled_start_time,
      formatted_status,
      waitlist_threshold,
    )

    const discord_attendees = await context.api.guilds.getScheduledEventUsers(
      guild_id,
      id,
    )
    const discord_attendee_ids = discord_attendees.map(
      discord_attendee => discord_attendee.user.id,
    )

    await context.database.sync_discord_attendees(id, discord_attendee_ids)

    for (const discord_attendee_id of discord_attendee_ids)
      await context.database.insert_attendee(
        id,
        discord_attendee_id,
        AttendeeSource.Discord,
      )

    const cached_event = await context.database.event(id)

    if (cached_event) context.cache.insert_event(cached_event)
  }

  await context.database.update_invalid_events(event_ids, guild_id)
}
