import { API } from '@discordjs/core'
import type { REST } from '@discordjs/rest'
import { Cache } from '../structs/cache.js'
import { Database } from '../structs/database.js'

interface ContextOptions {
  application_id: string
  rest: REST
}

export class Context {
  readonly api: API
  readonly application_id: string
  readonly cache = new Cache()
  readonly database = new Database()

  constructor(options: ContextOptions) {
    this.api = new API(options.rest)
    this.application_id = options.application_id
  }
}
