import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif-logo",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1520" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://wander-ai.vercel.app"
  ),
  title: {
    default: "Wander.AI — AI Travel Itinerary Planner",
    template: "%s | Wander.AI",
  },
  description:
    "Create personalised travel itineraries with AI. Plan your dream vacation in seconds with smart recommendations, weather forecasts, and budget tracking.",
  keywords: [
    "travel",
    "itinerary",
    "AI",
    "vacation planner",
    "trip planning",
    "travel assistant",
  ],
  authors: [{ name: "Wander.AI" }],
  creator: "Wander.AI",
  publisher: "Wander.AI",
  manifest: "/manifest.json",
  icons: {
    icon: "/globe.svg",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wander.AI",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wander-ai.vercel.app",
    siteName: "Wander.AI",
    title: "Wander.AI — AI Travel Itinerary Planner",
    description:
      "Create personalised travel itineraries with AI. Plan your dream vacation in seconds.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wander.AI — AI Travel Itinerary Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wander.AI — AI Travel Itinerary Planner",
    description:
      "Create personalised travel itineraries with AI. Plan your dream vacation in seconds.",
    images: ["/og-image.png"],
    creator: "@wanderai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${playfairDisplay.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TooltipProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
