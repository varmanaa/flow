import type { GatewayReadyDispatchData } from 'discord-api-types/v10'
import type { Context } from '../structs/context.js'

export async function handle_ready(
  _context: Context,
  payload: GatewayReadyDispatchData,
) {
  const username = payload.user.username
  const discriminator = payload.user.discriminator.padStart(4, '0')

  console.log(`${username}#${discriminator} is ready!`)
}
