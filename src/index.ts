import { REST } from '@discordjs/rest'
import {
  CompressionMethod,
  WebSocketManager,
  WebSocketShardEvents,
} from '@discordjs/ws'
import {
  GatewayIntentBits,
  type RESTGetCurrentApplicationResult,
  Routes,
} from 'discord-api-types/v10'
import { handle_event } from './events/index.js'
import { Context } from './structs/context.js'
import { DISCORD_TOKEN } from './utilities/constants.js'

const rest = new REST().setToken(DISCORD_TOKEN)
const current_application = (await rest.get(
  Routes.currentApplication(),
)) as RESTGetCurrentApplicationResult
const application_id = current_application.id
const context = new Context({ application_id, rest })

await context.database.init()

const gateway = new WebSocketManager({
  compression: CompressionMethod.ZlibSync,
  intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildScheduledEvents,
  rest,
  shardCount: 1,
  token: DISCORD_TOKEN,
})

gateway.on(WebSocketShardEvents.Dispatch, event => handle_event(context, event))

await gateway.connect()
