import { prisma } from '@/lib/prisma';

export async function buildCsv() {
  const projects = await prisma.videoProject.findMany({ include: { titleCandidates: true, thumbnailTexts: true } });
  const head = ['id', 'status', 'genre', 'format', 'objective', 'titles', 'thumbs', 'tags'].join(',');
  const rows = projects.map((p) => {
    const fields = [
      p.id,
      p.status,
      p.genre,
      p.videoFormat,
      p.objective,
      p.titleCandidates.map((x) => x.text).join(' / '),
      p.thumbnailTexts.map((x) => x.text).join(' / '),
      p.tags
    ].map((v) => `"${String(v).replaceAll('"', '""')}"`);
    return fields.join(',');
  });
  return [head, ...rows].join('\n');
}

export async function buildMarkdown(projectId: string) {
  const p = await prisma.videoProject.findUniqueOrThrow({
    where: { id: projectId },
    include: { titleCandidates: true, thumbnailTexts: true, scriptSections: true, checklists: { include: { items: true } } }
  });

  const lines = [
    `# ${p.objective}`,
    `- ステータス: ${p.status}`,
    `- ジャンル: ${p.genre}`,
    '',
    '## タイトル候補',
    ...p.titleCandidates.map((x) => `- ${x.text}`),
    '',
    '## サムネ文言候補',
    ...p.thumbnailTexts.map((x) => `- ${x.text}`),
    '',
    '## 台本',
    ...p.scriptSections.map((s) => `### ${s.kind}\n${s.content || '（未入力）'}`),
    '',
    '## チェックリスト',
    ...p.checklists.flatMap((c) => [`### ${c.title}`, ...c.items.map((i) => `- [${i.checked ? 'x' : ' '}] ${i.text}`)])
  ];

  return lines.join('\n');
}
