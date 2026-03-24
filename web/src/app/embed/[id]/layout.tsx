export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render children directly without any wrapper.
  // The embed page manages its own full HTML document inline via
  // dangerouslySetInnerHTML styles and raw HTML elements, but since
  // Next.js App Router nests under the root layout's <html>/<body>,
  // we strip all root chrome by returning only children here.
  return <>{children}</>;
}
