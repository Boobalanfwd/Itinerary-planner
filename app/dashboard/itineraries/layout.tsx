import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Itineraries",
  description:
    "Browse, manage, and share all your AI-generated travel itineraries in one place.",
};

export default function ItinerariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
