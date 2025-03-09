if (
  typeof process.env.DATABASE_URL !== 'string' ||
  !process.env.DATABASE_URL.length
)
  throw new Error('Environment variable "DATABASE_URL" is not set.')
if (
  typeof process.env.DISCORD_TOKEN !== 'string' ||
  !process.env.DISCORD_TOKEN.length
)
  throw new Error('Environment variable "DISCORD_TOKEN" is not set.')

export const DATABASE_URL = process.env.DATABASE_URL
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN
