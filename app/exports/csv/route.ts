import { buildCsv } from '@/lib/exporters';

export async function GET() {
  const csv = await buildCsv();
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="video-desk.csv"'
    }
  });
}
