import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) return null;

        const valid = bcrypt.compareSync(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          providerStatus: user.providerStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.providerStatus = user.providerStatus;
      }

      // Keep role/providerStatus fresh (e.g. after an admin approves the
      // provider application) without forcing the user to log out/in.
      if (trigger === "update" || !user) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true, providerStatus: true },
          });
          if (fresh) {
            token.role = fresh.role;
            token.providerStatus = fresh.providerStatus;
          }
        } catch (e) {
          // DB hiccup shouldn't break the session — fall back to cached token
        }
      }

      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.providerStatus = token.providerStatus;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
