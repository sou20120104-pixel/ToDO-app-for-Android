import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { STATUS_LABELS, FORMAT_LABELS } from '@/lib/constants';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const status = typeof params.status === 'string' ? params.status : 'ALL';
  const sort = typeof params.sort === 'string' ? params.sort : 'updatedAt_desc';

  const where: Prisma.VideoProjectWhereInput = {
    ...(status !== 'ALL' ? { status: status as never } : {}),
    ...(q
      ? {
          OR: [{ objective: { contains: q } }, { genre: { contains: q } }, { tags: { contains: q } }]
        }
      : {})
  };

  const orderBy =
    sort === 'createdAt_asc'
      ? { createdAt: 'asc' as const }
      : sort === 'createdAt_desc'
        ? { createdAt: 'desc' as const }
        : sort === 'objective_asc'
          ? { objective: 'asc' as const }
          : { updatedAt: 'desc' as const };

  const projects = await prisma.videoProject.findMany({
    where,
    orderBy,
    include: { titleCandidates: { orderBy: { order: 'asc' }, take: 1 } }
  });

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="mb-3 text-xl font-bold">動画一覧</h1>
        <form className="grid gap-2 md:grid-cols-4">
          <input name="q" defaultValue={q} placeholder="検索（目的 / ジャンル / タグ）" className="input md:col-span-2" />
          <select name="status" defaultValue={status} className="select">
            <option value="ALL">全ステータス</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="select">
            <option value="updatedAt_desc">更新順</option>
            <option value="createdAt_desc">作成日(新)</option>
            <option value="createdAt_asc">作成日(旧)</option>
            <option value="objective_asc">目的A-Z</option>
          </select>
          <button className="btn-primary md:col-span-1" type="submit">絞り込み</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/videos/new" className="btn-primary">+ 新規作成</Link>
          <Link href="/exports/csv" className="btn-secondary">CSVエクスポート</Link>
        </div>
      </section>

      {projects.length === 0 ? (
        <section className="card text-sm text-slate-600">動画案がありません。まずは「新規作成」から始めましょう。</section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/videos/${p.id}`} className="card block hover:border-brand-500">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="rounded bg-slate-100 px-2 py-1">{STATUS_LABELS[p.status]}</span>
                <span>{FORMAT_LABELS[p.videoFormat]}</span>
              </div>
              <h2 className="line-clamp-2 font-semibold">{p.objective}</h2>
              <p className="mt-1 text-sm text-slate-600">ジャンル: {p.genre}</p>
              <p className="mt-1 text-sm text-slate-600">タイトル: {p.titleCandidates[0]?.text ?? '未設定'}</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
