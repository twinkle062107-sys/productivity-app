import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { ensureOnboardingQuests } from "@/lib/onboarding";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      if (user?.id) {
        // Seed starter quests for new players on their first successful sign-in.
        await ensureOnboardingQuests(user.id);
      }
      return true;
    },
    session({ session, user }) {
      // Ensure the session carries the stable DB user id so server code can
      // associate quests/XP/streaks with the correct account.
      if (session.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
