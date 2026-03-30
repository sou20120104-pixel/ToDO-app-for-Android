import { buildMarkdown } from '@/lib/exporters';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const markdown = await buildMarkdown(id);
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="video-${id}.md"`
    }
  });
}
