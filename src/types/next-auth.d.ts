// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession } from "next-auth"

export type UserRole = "superadmin" | "admin" | "kadant-team" | "client";

declare module "next-auth" {
    interface User {
        _id?: string
        phone?: string
        designation?: string
        isReadOnly?: boolean
        role?: UserRole
        username?: string
    }

    interface Session {
        accessToken?: string
        user: {
            _id?: string
            phone?: string
            designation?: string
            isReadOnly?: boolean
            role?: UserRole
            username?: string
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string
        accessToken?: string
        phone?: string
        designation?: string
        isReadOnly?: boolean
        role?: UserRole
        username?: string
    }
}
