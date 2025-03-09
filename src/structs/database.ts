import postgres from 'postgres'
import type { RequireAtLeastOne } from 'type-fest'
import { DATABASE_URL } from '../utilities/constants.js'
import type { CachedEvent } from './cache.js'

export enum EventStatus {
  Active = 'active',
  Canceled = 'canceled',
  Completed = 'completed',
  Scheduled = 'scheduled',
  Unknown = 'unknown',
}

export enum AttendeeSource {
  Discord = 'discord',
  Named = 'named',
}

type EventUpdateData = RequireAtLeastOne<
  {
    name: string
    start_time: string
    status: EventStatus
    waitlist_threshold: number | null
  },
  'name' | 'start_time' | 'status' | 'waitlist_threshold'
>

export class Database {
  private readonly sql = postgres(DATABASE_URL, {
    debug: true,
    max: 16,
    max_lifetime: 10,
    onnotice: () => false,
  })

  async attendees(
    event_id: string,
  ): Promise<{ list: string[]; waitlist: string[] }> {
    const result = await this.sql<[{ list: string[]; waitlist: string[] }]>`
      with formatted_attendee as (
        select
          case
            when attendee.source = 'discord' then format('%s. <@%s>', attendee.position, attendee.identifier)
            else format('%s. %s', attendee.position, attendee.identifier)
          end identifier_text,
          attendee.position,
          (event.waitlist_threshold is not null) and (attendee.position > event.waitlist_threshold) is_waitlisted
        from
          event
          join attendee on attendee.event_id = event.id
        where
          event.id = ${event_id}
      )
      select
        coalesce(
          array_agg(
            formatted_attendee.identifier_text
            order by
              formatted_attendee.position
          ) filter (where not formatted_attendee.is_waitlisted),
          '{}'
        ) list,
        coalesce(
          array_agg(
            formatted_attendee.identifier_text
            order by
              formatted_attendee.position
          ) filter (where formatted_attendee.is_waitlisted),
          '{}'
        ) waitlist
      from
        formatted_attendee;
    `

    return result[0]
  }

  async end() {
    await this.sql.end()
  }

  async event(event_id: string): Promise<CachedEvent | null> {
    const result = await this.sql<
      Required<
        Omit<CachedEvent, 'lower_identifiers'> & { lower_identifiers: string[] }
      >[]
    >`
      select
        event.id,
        event.guild_id,
        format(
          '%s (%s)',
          event.name,
          to_char(event.start_time at time zone 'America/Toronto', 'YYYY-MM-DD')
        ) label,
        event.waitlist_threshold,
        attendee_aggregate.lower_identifiers
      from
        event
        left join lateral (
          select
            coalesce(array_agg(attendee.lower_identifier), '{}') lower_identifiers
          from
            attendee
          where
            attendee.event_id = event.id
        ) attendee_aggregate on true
      where
        event.id = ${event_id}
      limit
        1;
    `

    if (result?.[0]) {
      const lower_identifiers = new Set(result[0].lower_identifiers)

      return {
        ...result[0],
        lower_identifiers,
      }
    }

    return null
  }

  async init() {
    await this.sql`
      -- attendee_source enum
      do $$
      begin
        create type attendee_source as enum (
          'discord',
          'named'
        );
      exception
        when duplicate_object then null;
      end $$;

      -- event_status enum
      do $$
      begin
        create type event_status as enum (
          'active',
          'canceled',
          'completed',
          'scheduled',
          'unknown'
        );
      exception
        when duplicate_object then null;
      end $$;

      -- event table
      create table if not exists public.event (
        id text primary key,
        guild_id text not null,
        name varchar(100) not null,
        start_time timestamp with time zone not null,
        status event_status not null,
        waitlist_threshold int2
      );

      -- attendee table
      create table if not exists public.attendee (
        event_id text not null,
        identifier text not null,
        lower_identifier text not null generated always as (lower(identifier)) stored,
        source attendee_source not null,
        position int2,
        primary key(event_id, lower_identifier)
      );

      -- additional indices
      create index if not exists event_guild_id_idx on event(guild_id);
      create index if not exists attendee_event_id_idx on attendee(event_id);
    `.simple()
  }

  async insert_attendee(
    event_id: string,
    identifier: string,
    source: AttendeeSource,
  ) {
    await this.sql`
      insert into
        attendee (event_id, identifier, source, position)
      values
        (
          ${event_id},
          ${identifier},
          ${source},
          (
            select
              coalesce(max(_.position), 0) + 1
            from
              attendee _
            where
              _.event_id = ${event_id}
          )
        )
      on conflict (event_id, lower_identifier) do nothing;
    `
  }

  async remove_attendee(
    event_id: string,
    identifier: string,
    source: AttendeeSource,
  ) {
    await this.sql`
      with deleted_attendee as (
        delete from
          attendee
        where
          attendee.event_id = ${event_id}
          and attendee.lower_identifier = lower(${identifier})
          and attendee.source = ${source}
        returning *
      )
      update
        attendee
      set
        position = attendee.position - (
          select
            count(*)
          from
            deleted_attendee
          where
            attendee.position > deleted_attendee.position
        )
      where
        attendee.event_id = ${event_id};
    `
  }

  async swap_attendee_positions(
    event_id: string,
    position_one: number,
    position_two: number,
  ) {
    await this.sql`
      update
        attendee
      set
        position = (
          case
            when position = ${position_one} then ${position_two}
            when position = ${position_two} then ${position_one}
          end
        )::int2
      where
        attendee.event_id = ${event_id}
        and attendee.position in (${position_one}, ${position_two});
    `
  }

  async sync_discord_attendees(event_id: string, identifiers: string[]) {
    const sanitized_identifiers = identifiers.length ? identifiers : ['']

    await this.sql`
      with deleted_attendee as (
        delete from
          attendee
        where
          attendee.event_id = ${event_id}
          and attendee.lower_identifier not in ${this.sql(sanitized_identifiers)}
          and attendee.source = 'discord'
        returning *
      )
      update
        attendee
      set
        position = attendee.position - (
          select
            count(*)
          from
            deleted_attendee
          where
            attendee.position > deleted_attendee.position
        )
      where
        attendee.event_id = ${event_id};
    `
  }

  async update_event(id: string, update: EventUpdateData) {
    await this.sql`
      update
        event
      set
        ${this.sql(update)}
      where
        id = ${id};
    `
  }

  async update_invalid_events(event_ids: string[], guild_id: string) {
    const sanitized_event_ids = event_ids.length ? event_ids : ['']

    await this.sql`
      update
        event
      set
        status = 'unknown'
      where
        event.id not in ${this.sql(sanitized_event_ids)}
        and event.guild_id = ${guild_id}
        and event.status in ('active', 'scheduled');
    `
  }

  async upsert_event(
    id: string,
    guild_id: string,
    name: string,
    start_time: string,
    status: EventStatus,
    waitlist_threshold: number | null,
  ) {
    const event = {
      id,
      guild_id,
      name,
      start_time,
      status,
      waitlist_threshold,
    }

    await this.sql`
      insert into
        event ${this.sql(event)}
      on conflict (id) do update
      set
        name = excluded.name,
        start_time = excluded.start_time,
        status = excluded.status;
    `
  }
}
