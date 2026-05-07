import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

const hasGoogleCredentials =
  !!process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret'

// Mock 로그인은 살아있으면 누구나 mock-user-001 로 들어올 수 있어 치명적이다.
// 명시적으로 ENABLE_MOCK_AUTH=true 가 설정된 환경에서만 활성화.
// (운영에서 절대 켜지지 않게 하려면 Vercel Production 환경변수에서 이 값을 비워둘 것.
//  실제 Google OAuth 가 준비되면 이 토글을 영구 제거 권장.)
const enableMockAuth = process.env.ENABLE_MOCK_AUTH === 'true'

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
    ...(enableMockAuth
      ? [
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
        ]
      : []),
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
