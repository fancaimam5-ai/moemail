import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      roles: { name: string }[]
      providers: string[]
    } & DefaultSession['user']
  }
}
