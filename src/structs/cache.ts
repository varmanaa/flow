export type CachedEvent = {
  id: string
  guild_id: string
  label: string
  waitlist_threshold: number | null
  lower_identifiers: Set<string>
}

export class Cache {
  readonly #guild_event_ids: Map<string, Set<string>> = new Map()
  readonly #events: Map<string, CachedEvent> = new Map()

  event(event_id: string): CachedEvent | null {
    return this.#events.get(event_id) ?? null
  }

  guild_event_ids(guild_id: string): Set<string> {
    return this.#guild_event_ids.get(guild_id) ?? new Set()
  }

  insert_event(event: CachedEvent) {
    const { id, guild_id } = event

    this.#events.set(id, event)

    const guild_event_ids = this.#guild_event_ids.get(guild_id)

    if (!guild_event_ids) this.#guild_event_ids.set(guild_id, new Set([id]))
    else guild_event_ids.add(id)
  }

  insert_identifier(event_id: string, lower_identifier: string) {
    const event = this.#events.get(event_id)

    if (event) event.lower_identifiers.add(lower_identifier)
  }

  remove_event(event_id: string) {
    const event = this.#events.get(event_id)

    this.#events.delete(event_id)

    if (event) this.#guild_event_ids.get(event.guild_id)?.delete(event_id)
  }

  remove_identifier(event_id: string, lower_identifier: string) {
    const event = this.#events.get(event_id)

    if (event) event.lower_identifiers.delete(lower_identifier)
  }

  update_label(event_id: string, label: string) {
    const event = this.#events.get(event_id)

    if (event) event.label = label
  }

  update_waitlist_threshold(event_id: string, threshold: number | null) {
    const event = this.#events.get(event_id)

    if (event) event.waitlist_threshold = threshold
  }
}
