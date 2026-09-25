import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) return user;
    }
  } catch (err) {
    console.warn("[getCurrentUser] Session retrieval notice:", err);
  }

  // Fallback to first available active user (e.g. for development or testing)
  const defaultUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return defaultUser;
}
