import { PrismaClient, ChecklistType, VideoFormat, VideoStatus, TemplateType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      bannedWords: '炎上,差別,誹謗'
    }
  });

  await prisma.template.createMany({
    data: [
      {
        name: '基本台本テンプレート',
        type: TemplateType.SCRIPT,
        content: JSON.stringify({
          intro: '今日のテーマを30秒で提示',
          problem: 'よくある悩みを具体化',
          main: '解決策を3つ紹介',
          summary: '要点を箇条書きで復習',
          cta: 'チャンネル登録とコメント促進'
        })
      },
      {
        name: '撮影・編集チェック',
        type: TemplateType.CHECKLIST,
        content: JSON.stringify({
          shooting: ['マイク音量確認', '照明確認'],
          editing: ['不要部分カット', 'BGM調整'],
          prepost: ['概要欄作成', 'タグ設定']
        })
      }
    ],
    skipDuplicates: true
  });

  const project = await prisma.videoProject.create({
    data: {
      genre: '解説',
      videoFormat: VideoFormat.LONG,
      targetAudience: '副業を始めたい社会人',
      objective: '視聴維持率の高い導入を作る',
      scriptMemo: '結論先出しを意識する',
      structureMemo: '3部構成',
      status: VideoStatus.PLANNING,
      tags: '副業,YouTube,解説',
      notes: '公開は金曜夜',
      titleCandidates: {
        create: [{ text: '副業初心者が最初にやるべき3ステップ', order: 0 }]
      },
      thumbnailTexts: {
        create: [{ text: '今すぐ開始', order: 0 }]
      },
      scriptSections: {
        create: [
          { kind: '導入', content: '結論を最初に伝える', order: 0 },
          { kind: '問題提起', content: 'よくある失敗を紹介', order: 1 },
          { kind: '本編', content: '具体手順を解説', order: 2 },
          { kind: 'まとめ', content: '要点を振り返る', order: 3 },
          { kind: 'CTA', content: '次動画へ誘導', order: 4 }
        ]
      },
      checklists: {
        create: [
          {
            type: ChecklistType.SHOOTING,
            title: '撮影チェック',
            order: 0,
            items: { create: [{ text: '音声ノイズ確認', order: 0 }] }
          },
          {
            type: ChecklistType.EDITING,
            title: '編集チェック',
            order: 1,
            items: { create: [{ text: 'テロップ誤字確認', order: 0 }] }
          },
          {
            type: ChecklistType.PREPOST,
            title: '投稿前チェック',
            order: 2,
            items: { create: [{ text: 'サムネ最終確認', order: 0 }] }
          }
        ]
      }
    }
  });

  console.log(`seeded project: ${project.id}`);
}

main().finally(async () => {
  await prisma.$disconnect();
});
