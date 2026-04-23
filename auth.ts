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
            // 탈퇴 후 재로그인 등 세션이 끝난 뒤에는 항상 계정 선택창을 띄워
            // 사용자가 의식적으로 어떤 구글 계정으로 들어올지 고르도록 한다.
            authorization: { params: { prompt: 'select_account' } },
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
