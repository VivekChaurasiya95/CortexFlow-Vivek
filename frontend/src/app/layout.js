import "./globals.css";

export const metadata = {
  title: "CortexFlow — Idea to Strategy Intelligence",
  description: "Transform your product ideas into structured, evidence-backed strategies using AI-powered research, risk analysis, market insights, and roadmap generation.",
  keywords: ["product strategy", "AI", "idea validation", "market research", "startup"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
