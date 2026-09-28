"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UnifiedChatRoom } from "@/components/community/UnifiedChatRoom";

export default function ChatRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Safe client redirect when unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard/chat");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">
            Entering Travellers Hub...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto">
      <UnifiedChatRoom />
    </div>
  );
}
