import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { STATUS_LABELS } from '@/lib/constants';
import {
  addChecklistItem,
  applyTemplate,
  changeStatus,
  duplicateProject,
  toggleChecklistItem,
  updateProjectMeta,
  updateScriptSection,
  updateThumbTexts,
  updateTitles
} from '@/app/actions';
import { CopyButton } from '@/components/CopyButton';

export default async function VideoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, setting, templates] = await Promise.all([
    prisma.videoProject.findUnique({
      where: { id },
      include: {
        titleCandidates: { orderBy: { order: 'asc' } },
        thumbnailTexts: { orderBy: { order: 'asc' } },
        scriptSections: { orderBy: { order: 'asc' } },
        checklists: { include: { items: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } }
      }
    }),
    prisma.setting.findUnique({ where: { id: 'global' } }),
    prisma.template.findMany({ orderBy: { updatedAt: 'desc' } })
  ]);

  if (!project) return notFound();

  const titleText = project.titleCandidates.map((x) => x.text).join('\n');
  const thumbText = project.thumbnailTexts.map((x) => x.text).join('\n');
  const bannedWords = (setting?.bannedWords ?? '').split(',').map((x) => x.trim()).filter(Boolean);

  const warn = (text: string, max: number) => text.length > max;
  const includeBanned = (text: string) => bannedWords.some((w) => text.includes(w));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">動画詳細</h1>
        <div className="flex gap-2">
          <Link href={`/exports/markdown/${project.id}`} className="btn-secondary">Markdown書き出し</Link>
          <form action={duplicateProject}><input type="hidden" name="id" value={project.id} /><button className="btn-secondary">複製</button></form>
        </div>
      </div>

      <section className="card">
        <h2 className="mb-3 font-semibold">基本情報</h2>
        <form action={updateProjectMeta} className="grid gap-2 md:grid-cols-2">
          <input type="hidden" name="id" value={project.id} />
          <label>ジャンル<input className="input" name="genre" defaultValue={project.genre} /></label>
          <label>形式<select className="select" name="videoFormat" defaultValue={project.videoFormat}><option value="SHORTS">Shorts</option><option value="LONG">長尺</option></select></label>
          <label>ターゲット<input className="input" name="targetAudience" defaultValue={project.targetAudience} /></label>
          <label>目的<input className="input" name="objective" defaultValue={project.objective} /></label>
          <label className="md:col-span-2">台本メモ<textarea className="textarea" name="scriptMemo" defaultValue={project.scriptMemo} /></label>
          <label className="md:col-span-2">構成メモ<textarea className="textarea" name="structureMemo" defaultValue={project.structureMemo} /></label>
          <label>公開予定日<input className="input" type="date" name="scheduledPublishAt" defaultValue={project.scheduledPublishAt?.toISOString().slice(0, 10)} /></label>
          <label>タグ<input className="input" name="tags" defaultValue={project.tags} /></label>
          <label className="md:col-span-2">備考<textarea className="textarea" name="notes" defaultValue={project.notes} /></label>
          <button className="btn-primary" type="submit">基本情報を保存</button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="mb-2 flex justify-between"><h2 className="font-semibold">タイトル候補</h2><CopyButton label="コピー" text={titleText} /></div>
          <form action={updateTitles} className="space-y-2">
            <input type="hidden" name="id" value={project.id} />
            <textarea name="titles" defaultValue={titleText} className="textarea h-36" />
            <ul className="space-y-1 text-xs">
              {project.titleCandidates.map((x) => (
                <li key={x.id} className={warn(x.text, setting?.titleMaxLength ?? 45) || includeBanned(x.text) ? 'text-rose-600' : 'text-slate-500'}>
                  {x.text}（{x.text.length}文字）
                  {warn(x.text, setting?.titleMaxLength ?? 45) ? ' / 長すぎます' : ''}
                  {includeBanned(x.text) ? ' / 禁止ワード含む' : ''}
                </li>
              ))}
            </ul>
            <button className="btn-primary">タイトルを保存</button>
          </form>
        </div>

        <div className="card">
          <div className="mb-2 flex justify-between"><h2 className="font-semibold">サムネ文言候補</h2><CopyButton label="コピー" text={thumbText} /></div>
          <form action={updateThumbTexts} className="space-y-2">
            <input type="hidden" name="id" value={project.id} />
            <textarea name="thumbnailTexts" defaultValue={thumbText} className="textarea h-36" />
            <ul className="space-y-1 text-xs">
              {project.thumbnailTexts.map((x) => (
                <li key={x.id} className={warn(x.text, setting?.thumbnailTextMaxLength ?? 14) || includeBanned(x.text) ? 'text-rose-600' : 'text-slate-500'}>
                  {x.text}（{x.text.length}文字）
                  {warn(x.text, setting?.thumbnailTextMaxLength ?? 14) ? ' / 長すぎます' : ''}
                  {includeBanned(x.text) ? ' / 禁止ワード含む' : ''}
                </li>
              ))}
            </ul>
            <button className="btn-primary">サムネ文言を保存</button>
          </form>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">台本構成</h2>
        {project.scriptSections.map((section) => (
          <form key={section.id} action={updateScriptSection} className="space-y-2">
            <input type="hidden" name="id" value={project.id} />
            <input type="hidden" name="sectionId" value={section.id} />
            <label className="font-medium">{section.kind}</label>
            <textarea className="textarea h-24" name="content" defaultValue={section.content} />
            <button className="btn-primary">{section.kind}を保存</button>
          </form>
        ))}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">チェックリスト</h2>
        {project.checklists.map((checklist) => (
          <div key={checklist.id} className="rounded-lg border p-3">
            <h3 className="mb-2 font-medium">{checklist.title}</h3>
            <div className="space-y-2">
              {checklist.items.map((item) => (
                <form key={item.id} action={toggleChecklistItem} className="flex items-center gap-2">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="checked" value={String(!item.checked)} />
                  <button className="text-left text-sm" type="submit">{item.checked ? '✅' : '⬜'} {item.text}</button>
                </form>
              ))}
              <form action={addChecklistItem} className="flex gap-2">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="checklistId" value={checklist.id} />
                <input className="input" name="text" placeholder="新しい項目" />
                <button className="btn-secondary">追加</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="card grid gap-2 md:grid-cols-2">
        <form action={changeStatus} className="space-y-2">
          <input type="hidden" name="id" value={project.id} />
          <label className="font-semibold">ステータス変更</label>
          <select className="select" name="status" defaultValue={project.status}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn-primary">ステータス保存</button>
        </form>
        <form action={applyTemplate} className="space-y-2">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="font-semibold">テンプレート適用</label>
          <select className="select" name="templateId">
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.type === 'SCRIPT' ? '台本' : 'チェック'})</option>)}
          </select>
          <button className="btn-primary">テンプレート適用</button>
        </form>
      </section>
    </div>
  );
}
