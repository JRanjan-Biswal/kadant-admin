// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth"

declare module "next-auth" {
    interface User {
        phone?: string
        designation?: string
    }

    interface Session {
        user: {
            phone?: string
            designation?: string
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        phone?: string
        designation?: string
    }
}