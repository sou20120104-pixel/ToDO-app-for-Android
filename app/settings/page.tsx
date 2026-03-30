import { prisma } from '@/lib/prisma';
import { saveSettings } from '@/app/actions';

export default async function SettingsPage() {
  const setting = await prisma.setting.findUnique({ where: { id: 'global' } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">設定</h1>
      <section className="card max-w-xl">
        <form action={saveSettings} className="grid gap-3">
          <label>タイトル最大文字数
            <input className="input" name="titleMaxLength" type="number" min={1} defaultValue={setting?.titleMaxLength ?? 45} />
          </label>
          <label>サムネ文言最大文字数
            <input className="input" name="thumbnailTextMaxLength" type="number" min={1} defaultValue={setting?.thumbnailTextMaxLength ?? 14} />
          </label>
          <label>禁止ワード（カンマ区切り）
            <textarea className="textarea h-24" name="bannedWords" defaultValue={setting?.bannedWords ?? ''} />
          </label>
          <button className="btn-primary">設定を保存</button>
        </form>
      </section>
    </div>
  );
}
