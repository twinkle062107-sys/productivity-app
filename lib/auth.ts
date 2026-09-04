import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { ensureOnboardingQuests } from "@/lib/onboarding";

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "Demo Account",
    credentials: {
      email: { label: "Email", type: "email" },
      name: { label: "Name", type: "text" },
    },
    async authorize(credentials) {
      const email = ((credentials?.email as string) || "hero@questdaily.app")
        .trim()
        .toLowerCase();
      const name = ((credentials?.name as string) || "Hero").trim();

      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
          },
        });
        await ensureOnboardingQuests(user.id);
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: false,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || "dev-secret-key-for-questdaily-gamified-productivity",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers,
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureOnboardingQuests(user.id);
      }
    },
  },
});

