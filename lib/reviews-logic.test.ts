import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortOpinions,
  resolveApkDownloadUrl,
  validateOpinionInput,
  validateReleaseSettingsInput,
  type OpinionItem,
} from './reviews-logic';

test('validateOpinionInput rejects short fields and trims valid Arabic opinions', () => {
  const bad = validateOpinionInput({
    authorName: 'ع',
    authorRole: 'طالب',
    comment: 'قصير',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.authorName);
  assert.ok(bad.errors.comment);

  const good = validateOpinionInput({
    authorName: '  محمود   السيد  ',
    authorRole: ' ثالثة ثانوي ',
    comment: '  المؤقت العائم ساعدني جداً على تنظيم وقت المذاكرة يومياً.  ',
  });
  assert.equal(good.valid, true);
  assert.equal(good.sanitized?.authorName, 'محمود السيد');
  assert.equal(good.sanitized?.authorRole, 'ثالثة ثانوي');
});

test('filterAndSortOpinions prioritizes featured opinions and supports search and helpful sort', () => {
  const sample: OpinionItem[] = [
    {
      id: 1,
      authorName: 'سارة',
      authorRole: 'طب بشري',
      comment: 'المكتبة الدراسية ممتازة لتنظيم ملفات PDF.',
      appVersion: '2.7',
      helpfulCount: 2,
      isFeatured: false,
      createdAt: '2026-11-10T10:00:00.000Z',
    },
    {
      id: 2,
      authorName: 'أحمد',
      authorRole: 'هندسة',
      comment: 'السبورة الذكية عملية جداً لحل المسائل.',
      appVersion: '2.7',
      helpfulCount: 9,
      isFeatured: false,
      createdAt: '2026-11-09T10:00:00.000Z',
    },
    {
      id: 3,
      authorName: 'يوسف',
      authorRole: 'ثانوي',
      comment: 'مخطط البطولة الأسبوعي حافظ على التزامي.',
      appVersion: '2.6',
      helpfulCount: 1,
      isFeatured: true,
      createdAt: '2026-11-08T10:00:00.000Z',
    },
  ];

  const byHelpful = filterAndSortOpinions(sample, '', 'helpful');
  assert.deepEqual(
    byHelpful.map((x) => x.id),
    [3, 2, 1],
  );

  const searched = filterAndSortOpinions(sample, 'السبورة', 'newest');
  assert.deepEqual(
    searched.map((x) => x.id),
    [2],
  );
});

test('validateReleaseSettingsInput enforces URL and required metadata', () => {
  const bad = validateReleaseSettingsInput({
    version: '2.8',
    versionCode: 8,
    fileSizeLabel: '40 MB',
    minAndroid: 'Android 8.0+',
    packageName: 'com.nageebstudyos.study',
    apkDownloadUrl: 'javascript:alert(1)',
    heroTitle: 'تطبيق النجيب للمذاكرة',
    heroSubtitle: 'منظومة دراسة كاملة بدون إنترنت.',
    licenseNote: 'مجاني',
    repoUrl: 'https://github.com/MahmoudNageeb/AL-NAGEEB',
  });
  assert.equal(bad.valid, false);

  const good = validateReleaseSettingsInput({
    version: '2.8',
    versionCode: 8,
    fileSizeLabel: '40.2 MB',
    minAndroid: 'Android 8.0+',
    packageName: 'com.nageebstudyos.study',
    apkDownloadUrl: 'https://github.com/MahmoudNageeb/AL-NAGEEB/releases/download/v2.8/app.apk',
    heroTitle: 'منظومة النجيب للدراسة والتركيز',
    heroSubtitle: 'تطبيق أندرويد متكامل يعمل بالكامل على جهازك.',
    licenseNote: 'مجاني بالكامل',
    repoUrl: 'https://github.com/MahmoudNageeb/AL-NAGEEB',
    announcementText: 'تم إطلاق التحديث الجديد',
  });
  assert.equal(good.valid, true);
  assert.equal(good.sanitized?.version, '2.8');
});

test('resolveApkDownloadUrl falls back safely when unset or invalid', () => {
  assert.equal(
    resolveApkDownloadUrl('https://github.com/MahmoudNageeb/AL-NAGEEB/releases/download/v2.7/app.apk'),
    'https://github.com/MahmoudNageeb/AL-NAGEEB/releases/download/v2.7/app.apk',
  );
  assert.ok(resolveApkDownloadUrl(undefined).startsWith('https://github.com/MahmoudNageeb/AL-NAGEEB'));
  assert.ok(resolveApkDownloadUrl('javascript:alert(1)').startsWith('https://github.com/MahmoudNageeb/AL-NAGEEB'));
});
