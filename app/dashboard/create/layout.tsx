import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Trip",
  description:
    "Use Wander.AI to generate a personalized travel itinerary with smart AI recommendations in seconds.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
