// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'RedKey – Bug Bounty Pro',
  description: 'Workspace dla hunterów, pentesterów i bug bounty'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body style={{ background: "#050509", color: "#fafafa", margin: 0, fontFamily: "Inter, Arial, sans-serif" }}>
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>{children}</main>
      </body>
    </html>
  );
}
