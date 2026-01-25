import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/firebase";
import { User } from "@/types";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;

        try {
          const userSnapshot = await db
            .collection("users")
            .where("username", "==", username)
            .limit(1)
            .get();

          if (userSnapshot.empty) {
            return null;
          }

          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data() as User;

          // Verify password
          if ((userData as any).password !== credentials.password) {
            return null;
          }

          return {
            id: userDoc.id,
            email: userData.email,
            name: userData.name || userData.username,
            username: userData.username,
            role: userData.role,
            profileStatus: userData.profileStatus,
            mobile: userData.mobile,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials" && user) {
        try {
          const { logAction } = await import("@/lib/logger");
          await logAction(
            "USER_LOGIN",
            { loginMethod: "credentials" },
            { id: user.id as string, name: user.name || "Unknown" },
          );
        } catch (error) {
          console.error("Failed to log login action:", error);
        }
        return true;
      }
      return true;
    },
  },
});
