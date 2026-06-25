import type { Metadata } from "next";
import { Inria_Sans, Inria_Serif } from "next/font/google";
import "./globals.css";

const inriaSans = Inria_Sans({
  variable: "--font-inria-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const inriaSerif = Inria_Serif({
  variable: "--font-inria-serif",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "CogniVerdict Legal Workspace",
  description: "Advanced legal memory graph visualizer and advisory chat system powered by Cognee Cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inriaSans.variable} ${inriaSerif.variable} h-full antialiased bg-[#FAF6F0] text-[#2D312E]`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#FAF6F0] text-[#2D312E]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
