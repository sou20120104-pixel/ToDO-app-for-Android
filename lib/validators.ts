import { z } from 'zod';

export const videoCreateSchema = z.object({
  titleCandidates: z.string().min(1, 'タイトル候補は必須です。'),
  thumbnailTexts: z.string().min(1, 'サムネ文言候補は必須です。'),
  genre: z.string().min(1, 'ジャンルは必須です。'),
  videoFormat: z.enum(['SHORTS', 'LONG']),
  targetAudience: z.string().min(1, 'ターゲット視聴者は必須です。'),
  objective: z.string().min(1, '動画の目的は必須です。'),
  scriptMemo: z.string().default(''),
  structureMemo: z.string().default(''),
  scheduledPublishAt: z.string().optional(),
  tags: z.string().default(''),
  notes: z.string().default('')
});

export const settingsSchema = z.object({
  titleMaxLength: z.coerce.number().int().positive(),
  thumbnailTextMaxLength: z.coerce.number().int().positive(),
  bannedWords: z.string()
});

export const templateSchema = z.object({
  name: z.string().min(1, 'テンプレート名は必須です。'),
  type: z.enum(['SCRIPT', 'CHECKLIST']),
  content: z.string().min(1, 'テンプレート内容は必須です。')
});
