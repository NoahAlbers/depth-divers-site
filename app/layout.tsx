import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { PlayerProvider } from "@/lib/player-context";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { PlayerColorsProvider } from "@/lib/player-colors-context";
import { InstallPrompt } from "@/components/install-prompt";
import { TimerOverlay } from "@/components/timer-overlay";
import { PollOverlay } from "@/components/poll-overlay";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Depth Divers",
  description: "Campaign tools for the party",
  manifest: "/manifest.json",
  themeColor: "#e5c07b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Depth Divers",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzel.variable} ${jetbrainsMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <PlayerProvider>
          <PlayerColorsProvider>
            <ImpersonationBanner />
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
            <TimerOverlay />
            <PollOverlay />
            <InstallPrompt />
          </PlayerColorsProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
