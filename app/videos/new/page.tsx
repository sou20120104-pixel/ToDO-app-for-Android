import { prisma } from '@/lib/prisma';
import { createVideoProject } from '@/app/actions';

export default async function NewVideoPage() {
  const templates = await prisma.template.findMany({ orderBy: { updatedAt: 'desc' } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">動画作成</h1>
      <form action={createVideoProject} className="grid gap-3">
        <div className="card grid gap-3 md:grid-cols-2">
          <label>動画タイトル候補（改行区切り）<textarea name="titleCandidates" className="textarea h-28" required /></label>
          <label>サムネ文言候補（改行区切り）<textarea name="thumbnailTexts" className="textarea h-28" required /></label>
          <label>動画ジャンル<input name="genre" className="input" required /></label>
          <label>動画形式
            <select name="videoFormat" className="select" defaultValue="LONG">
              <option value="SHORTS">Shorts</option>
              <option value="LONG">長尺</option>
            </select>
          </label>
          <label>ターゲット視聴者<input name="targetAudience" className="input" required /></label>
          <label>動画の目的<input name="objective" className="input" required /></label>
          <label className="md:col-span-2">台本メモ<textarea name="scriptMemo" className="textarea h-24" /></label>
          <label className="md:col-span-2">構成メモ<textarea name="structureMemo" className="textarea h-24" /></label>
          <label>公開予定日<input name="scheduledPublishAt" type="date" className="input" /></label>
          <label>タグ（カンマ区切り）<input name="tags" className="input" /></label>
          <label className="md:col-span-2">備考<textarea name="notes" className="textarea h-24" /></label>
        </div>

        <div className="card">
          <h2 className="mb-2 font-semibold">テンプレート参照</h2>
          <p className="text-sm text-slate-600">作成後に詳細画面でテンプレートを適用できます。</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {templates.map((t) => <li key={t.id}>{t.name}</li>)}
          </ul>
        </div>

        <button className="btn-primary w-full sm:w-auto" type="submit">保存して作成</button>
      </form>
    </div>
  );
}
