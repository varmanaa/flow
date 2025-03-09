import {
  type GatewayGuildScheduledEventUpdateDispatchData,
  GuildScheduledEventStatus,
} from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'
import { EventStatus } from '../structs/database.js'

export async function handle_guild_scheduled_event_update(
  context: Context,
  payload: GatewayGuildScheduledEventUpdateDispatchData,
) {
  const { id, name, scheduled_start_time, status } = payload

  switch (status) {
    case GuildScheduledEventStatus.Scheduled: {
      await context.database.update_event(id, {
        name,
        start_time: scheduled_start_time,
        status: EventStatus.Scheduled,
      })

      const formatted_date = new Intl.DateTimeFormat('en-ca', {
        timeZone: 'America/Toronto',
      }).format(new Date(scheduled_start_time))
      const label = `${name} (${formatted_date})`

      context.cache.update_label(id, label)

      break
    }
    case GuildScheduledEventStatus.Active: {
      await context.database.update_event(id, {
        status: EventStatus.Active,
      })

      break
    }
    case GuildScheduledEventStatus.Completed: {
      await context.database.update_event(id, { status: EventStatus.Completed })

      context.cache.remove_event(id)

      break
    }
  }
}
