import NextAuth from "next-auth"
import axios from "axios";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/user/login`,
            {
              email: credentials.email,
              password: credentials.password,
            }
          );

          const user = response.data.user;
          const token = response.data.token;

          if (user) {
            return {
              ...user,
              accessToken: token,
            };
          } else {
            return null;
          }
        } catch (error) {
          console.log(error.response);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  pages: {
    signIn: "/dashboard",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.phone = user.phone;
        token.designation = user.designation;
        token.isReadOnly = user.isReadOnly || false;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; // Note: use 'picture' for images in JWT
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.email = session.email || token.email;
        token.phone = session.phone || token.phone;
        token.picture = session.image || token.picture;
        token.designation = session.designation || token.designation;
        token.isReadOnly = session.isReadOnly || token.isReadOnly;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.phone = token.phone;
      session.user.designation = token.designation;
      session.user.isReadOnly = token.isReadOnly;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)