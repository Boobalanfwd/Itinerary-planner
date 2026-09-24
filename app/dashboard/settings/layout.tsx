import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your Wander.AI account settings, notifications, and preferences.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
