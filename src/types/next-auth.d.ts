import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: string;
    phone?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      phone?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    phone?: string;
  }
}
