import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import * as userRepository from "@/features/users/repository";
import * as userService from "@/features/users/service";

// Google is only offered when real credentials are configured - an
// unconfigured OAuth provider would otherwise redirect to a broken
// Google consent screen instead of failing honestly up front. The login
// page checks the same thing (via getProviders()) to decide whether to
// show the "Continue with Google" button at all.
const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",

    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },

    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const user = await userRepository.findUserByEmail(credentials.email);

      // No password means this account only ever signed up via Google -
      // there's nothing to compare against, so credentials login must
      // fail rather than crash bcrypt.compare on a null hash.
      if (!user || !user.password) return null;

      const isValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Only Google flows through here - Credentials already resolves to a
    // real user id via authorize() above. Links to an existing account by
    // email if one already exists (e.g. previously registered with a
    // password), otherwise creates a new Google-only account. Mutating
    // `user` here is what lets the id/role/phone below flow through to
    // the jwt callback exactly like a Credentials sign-in does.
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      const dbUser = await userService.findOrCreateGoogleUser({
        email: user.email,
        name: user.name || user.email.split("@")[0],
        image: user.image,
      });

      user.id = dbUser.id;
      user.role = dbUser.role;
      user.phone = dbUser.phone;

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone ?? undefined;
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if ("phone" in session) token.phone = session.phone;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = token.name as string;
      session.user.phone = token.phone as string | undefined;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
