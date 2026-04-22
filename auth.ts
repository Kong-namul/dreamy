import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

const hasGoogleCredentials =
  !!process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...(hasGoogleCredentials
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      id: 'mock-google',
      name: 'Google',
      credentials: {},
      async authorize() {
        return {
          id: 'mock-user-001',
          name: '꿈꾸는 사람',
          email: 'dreamer@dreamy.app',
          image: null,
        }
      },
    }),
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
