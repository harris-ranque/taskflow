import type { Metadata } from "next";
import "./globals.css";
import { NotificationsProvider } from "@/components/notifications";

export const metadata: Metadata = {
  title: "Taskflow Frontend",
  description: "Next.js frontend for the Taskflow FastAPI backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NotificationsProvider>{children}</NotificationsProvider>
      </body>
    </html>
  );
}
