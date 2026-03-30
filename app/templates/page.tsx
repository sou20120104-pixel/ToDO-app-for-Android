import { prisma } from '@/lib/prisma';
import { saveTemplate } from '@/app/actions';

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { updatedAt: 'desc' } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">テンプレート管理</h1>
      <section className="card">
        <form action={saveTemplate} className="grid gap-2">
          <label>テンプレート名<input className="input" name="name" required /></label>
          <label>種類<select className="select" name="type" defaultValue="SCRIPT"><option value="SCRIPT">台本構成</option><option value="CHECKLIST">チェックリスト</option></select></label>
          <label>内容(JSON形式)
            <textarea className="textarea h-32" name="content" placeholder='{"intro":"..."} または {"shooting":["..."]}' required />
          </label>
          <button className="btn-primary">テンプレート保存</button>
        </form>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        {templates.length === 0 ? (
          <p className="card text-sm text-slate-600">テンプレートはまだありません。</p>
        ) : (
          templates.map((t) => (
            <article key={t.id} className="card">
              <h2 className="font-semibold">{t.name}</h2>
              <p className="text-xs text-slate-500">種別: {t.type === 'SCRIPT' ? '台本構成' : 'チェックリスト'}</p>
              <pre className="mt-2 overflow-x-auto rounded bg-slate-100 p-2 text-xs">{t.content}</pre>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
