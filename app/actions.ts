'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ChecklistType, VideoStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { settingsSchema, templateSchema, videoCreateSchema } from '@/lib/validators';

const defaultScriptKinds = ['導入', '問題提起', '本編', 'まとめ', 'CTA'];

function splitLines(v: string): string[] {
  return v
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function createVideoProject(formData: FormData) {
  const parsed = videoCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '入力エラーです。' };

  const data = parsed.data;
  const scheduledPublishAt = data.scheduledPublishAt ? new Date(data.scheduledPublishAt) : undefined;

  const created = await prisma.videoProject.create({
    data: {
      genre: data.genre,
      videoFormat: data.videoFormat,
      targetAudience: data.targetAudience,
      objective: data.objective,
      scriptMemo: data.scriptMemo,
      structureMemo: data.structureMemo,
      scheduledPublishAt,
      tags: data.tags,
      notes: data.notes,
      titleCandidates: {
        create: splitLines(data.titleCandidates).map((text, index) => ({ text, order: index }))
      },
      thumbnailTexts: {
        create: splitLines(data.thumbnailTexts).map((text, index) => ({ text, order: index }))
      },
      scriptSections: {
        create: defaultScriptKinds.map((kind, index) => ({ kind, order: index, content: '' }))
      },
      checklists: {
        create: [
          { type: ChecklistType.SHOOTING, title: '撮影チェックリスト', order: 0 },
          { type: ChecklistType.EDITING, title: '編集チェックリスト', order: 1 },
          { type: ChecklistType.PREPOST, title: '投稿前チェックリスト', order: 2 }
        ]
      }
    }
  });

  redirect(`/videos/${created.id}`);
}

export async function updateProjectMeta(formData: FormData) {
  const id = String(formData.get('id'));
  await prisma.videoProject.update({
    where: { id },
    data: {
      genre: String(formData.get('genre') ?? ''),
      targetAudience: String(formData.get('targetAudience') ?? ''),
      objective: String(formData.get('objective') ?? ''),
      scriptMemo: String(formData.get('scriptMemo') ?? ''),
      structureMemo: String(formData.get('structureMemo') ?? ''),
      tags: String(formData.get('tags') ?? ''),
      notes: String(formData.get('notes') ?? ''),
      videoFormat: String(formData.get('videoFormat')) as 'SHORTS' | 'LONG',
      scheduledPublishAt: formData.get('scheduledPublishAt') ? new Date(String(formData.get('scheduledPublishAt'))) : null
    }
  });
  revalidatePath(`/videos/${id}`);
}

export async function updateTitles(formData: FormData) {
  const id = String(formData.get('id'));
  const lines = splitLines(String(formData.get('titles') ?? ''));
  await prisma.$transaction([
    prisma.titleCandidate.deleteMany({ where: { videoProjectId: id } }),
    prisma.titleCandidate.createMany({
      data: lines.map((text, index) => ({ text, order: index, videoProjectId: id }))
    })
  ]);
  revalidatePath(`/videos/${id}`);
}

export async function updateThumbTexts(formData: FormData) {
  const id = String(formData.get('id'));
  const lines = splitLines(String(formData.get('thumbnailTexts') ?? ''));
  await prisma.$transaction([
    prisma.thumbnailTextCandidate.deleteMany({ where: { videoProjectId: id } }),
    prisma.thumbnailTextCandidate.createMany({
      data: lines.map((text, index) => ({ text, order: index, videoProjectId: id }))
    })
  ]);
  revalidatePath(`/videos/${id}`);
}

export async function updateScriptSection(formData: FormData) {
  const id = String(formData.get('id'));
  const sectionId = String(formData.get('sectionId'));
  await prisma.scriptSection.update({ where: { id: sectionId }, data: { content: String(formData.get('content') ?? '') } });
  revalidatePath(`/videos/${id}`);
}

export async function addChecklistItem(formData: FormData) {
  const projectId = String(formData.get('projectId'));
  const checklistId = String(formData.get('checklistId'));
  const text = String(formData.get('text') ?? '').trim();
  if (!text) return;

  const last = await prisma.checklistItem.findFirst({
    where: { checklistId },
    orderBy: { order: 'desc' }
  });
  await prisma.checklistItem.create({
    data: { text, checklistId, order: (last?.order ?? -1) + 1 }
  });
  revalidatePath(`/videos/${projectId}`);
}

export async function toggleChecklistItem(formData: FormData) {
  const projectId = String(formData.get('projectId'));
  const itemId = String(formData.get('itemId'));
  const checked = String(formData.get('checked')) === 'true';
  await prisma.checklistItem.update({ where: { id: itemId }, data: { checked } });
  revalidatePath(`/videos/${projectId}`);
}

export async function changeStatus(formData: FormData) {
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as VideoStatus;
  await prisma.videoProject.update({ where: { id }, data: { status } });
  revalidatePath(`/videos/${id}`);
  revalidatePath('/');
}

export async function duplicateProject(formData: FormData) {
  const id = String(formData.get('id'));
  const base = await prisma.videoProject.findUniqueOrThrow({
    where: { id },
    include: {
      titleCandidates: true,
      thumbnailTexts: true,
      scriptSections: true,
      checklists: { include: { items: true } }
    }
  });

  const created = await prisma.videoProject.create({
    data: {
      genre: base.genre,
      videoFormat: base.videoFormat,
      targetAudience: base.targetAudience,
      objective: `${base.objective}（複製）`,
      scriptMemo: base.scriptMemo,
      structureMemo: base.structureMemo,
      tags: base.tags,
      notes: base.notes,
      status: VideoStatus.PLANNING,
      titleCandidates: { create: base.titleCandidates.map((x) => ({ text: x.text, order: x.order })) },
      thumbnailTexts: { create: base.thumbnailTexts.map((x) => ({ text: x.text, order: x.order })) },
      scriptSections: { create: base.scriptSections.map((x) => ({ kind: x.kind, content: x.content, order: x.order })) },
      checklists: {
        create: base.checklists.map((c) => ({
          type: c.type,
          title: c.title,
          order: c.order,
          items: { create: c.items.map((i) => ({ text: i.text, checked: false, order: i.order })) }
        }))
      }
    }
  });

  redirect(`/videos/${created.id}`);
}

export async function saveTemplate(formData: FormData) {
  const parsed = templateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '入力エラーです。' };
  await prisma.template.create({ data: parsed.data });
  revalidatePath('/templates');
}

export async function applyTemplate(formData: FormData) {
  const projectId = String(formData.get('projectId'));
  const templateId = String(formData.get('templateId'));
  const template = await prisma.template.findUniqueOrThrow({ where: { id: templateId } });

  if (template.type === 'SCRIPT') {
    const content = JSON.parse(template.content) as Record<string, string>;
    await prisma.scriptSection.updateMany({ where: { videoProjectId: projectId }, data: { content: '' } });
    const sections = await prisma.scriptSection.findMany({ where: { videoProjectId: projectId } });
    for (const section of sections) {
      const key =
        section.kind === '導入'
          ? 'intro'
          : section.kind === '問題提起'
            ? 'problem'
            : section.kind === '本編'
              ? 'main'
              : section.kind === 'まとめ'
                ? 'summary'
                : 'cta';
      await prisma.scriptSection.update({ where: { id: section.id }, data: { content: content[key] ?? '' } });
    }
  } else {
    const content = JSON.parse(template.content) as Record<string, string[]>;
    const checklists = await prisma.checklist.findMany({ where: { videoProjectId: projectId } });
    for (const checklist of checklists) {
      const key = checklist.type === ChecklistType.SHOOTING ? 'shooting' : checklist.type === ChecklistType.EDITING ? 'editing' : 'prepost';
      await prisma.checklistItem.deleteMany({ where: { checklistId: checklist.id } });
      await prisma.checklistItem.createMany({
        data: (content[key] ?? []).map((text, index) => ({ checklistId: checklist.id, text, order: index }))
      });
    }
  }

  revalidatePath(`/videos/${projectId}`);
}

export async function saveSettings(formData: FormData) {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '設定値が不正です。' };
  await prisma.setting.upsert({ where: { id: 'global' }, update: parsed.data, create: { id: 'global', ...parsed.data } });
  revalidatePath('/settings');
  revalidatePath('/');
}
