export const metadata = { title: "Lumen Embed" };
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
return (
    <html lang="en">
      <body style={{ background: "transparent", margin: 0 }}>{children}</body>
    </html>
  );
}
