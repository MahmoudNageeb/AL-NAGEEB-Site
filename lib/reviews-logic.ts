export type OpinionSortOption = 'newest' | 'helpful';

export interface OpinionItem {
  id: number;
  authorName: string;
  authorRole: string;
  comment: string;
  appVersion: string;
  helpfulCount: number;
  isFeatured: boolean;
  createdAt: string;
  hasVoted?: boolean;
}

export interface OpinionInput {
  authorName: string;
  authorRole?: string;
  comment: string;
}

export interface OpinionValidationResult {
  valid: boolean;
  errors: {
    authorName?: string;
    authorRole?: string;
    comment?: string;
  };
  sanitized?: {
    authorName: string;
    authorRole: string;
    comment: string;
  };
}

export function validateOpinionInput(input: OpinionInput): OpinionValidationResult {
  const errors: OpinionValidationResult['errors'] = {};
  const authorName = (input.authorName ?? '').trim().replace(/\s+/g, ' ');
  const authorRole = (input.authorRole ?? '').trim().replace(/\s+/g, ' ');
  const comment = (input.comment ?? '').trim();

  if (authorName.length < 2) {
    errors.authorName = 'من فضلك اكتب اسمك (حرفين على الأقل).';
  } else if (authorName.length > 60) {
    errors.authorName = 'الاسم طويل شوية (الحد الأقصى 60 حرف).';
  }

  if (authorRole.length > 50) {
    errors.authorRole = 'السنة الدراسية أو التخصص ميتعداش 50 حرف.';
  }

  if (comment.length < 6) {
    errors.comment = 'اكتب رأيك أو تجربتك مع التطبيق (6 حروف على الأقل).';
  } else if (comment.length > 1000) {
    errors.comment = 'التعليق طويل أوي (الحد الأقصى 1000 حرف).';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: { authorName, authorRole, comment },
  };
}

export function filterAndSortOpinions(
  opinions: OpinionItem[],
  searchQuery: string,
  sortBy: OpinionSortOption,
): OpinionItem[] {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? opinions.filter(
        (item) =>
          item.authorName.toLowerCase().includes(q) ||
          item.authorRole.toLowerCase().includes(q) ||
          item.comment.toLowerCase().includes(q),
      )
    : [...opinions];

  filtered.sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }
    if (sortBy === 'helpful') {
      if (b.helpfulCount !== a.helpfulCount) return b.helpfulCount - a.helpfulCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return filtered;
}

export function resolveApkDownloadUrl(envUrl?: string | null): string {
  const trimmed = envUrl?.trim();
  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return 'https://github.com/MahmoudNageeb/AL-NAGEEB/releases/latest/download/AL-NAGEEB-v2.7.apk';
}

export interface ReleaseSettingsInput {
  version: string;
  versionCode: number;
  fileSizeLabel: string;
  minAndroid: string;
  packageName: string;
  apkDownloadUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  licenseNote: string;
  repoUrl: string;
  announcementText?: string;
}

export function validateReleaseSettingsInput(input: ReleaseSettingsInput): {
  valid: boolean;
  error?: string;
  sanitized?: ReleaseSettingsInput;
} {
  const version = (input.version ?? '').trim();
  const fileSizeLabel = (input.fileSizeLabel ?? '').trim();
  const minAndroid = (input.minAndroid ?? '').trim();
  const packageName = (input.packageName ?? '').trim();
  const apkDownloadUrl = (input.apkDownloadUrl ?? '').trim();
  const heroTitle = (input.heroTitle ?? '').trim();
  const heroSubtitle = (input.heroSubtitle ?? '').trim();
  const licenseNote = (input.licenseNote ?? '').trim();
  const repoUrl = (input.repoUrl ?? '').trim();
  const announcementText = (input.announcementText ?? '').trim();
  const versionCode = Number(input.versionCode);

  if (!version || version.length > 24) {
    return { valid: false, error: 'رقم الإصدار مش مظبوط.' };
  }
  if (!Number.isInteger(versionCode) || versionCode < 1 || versionCode > 999999) {
    return { valid: false, error: 'كود الإصدار (versionCode) لازم يكون رقم صحيح موجب.' };
  }
  if (!fileSizeLabel || fileSizeLabel.length > 32) {
    return { valid: false, error: 'اكتب حجم الملف بوضوح (زي 38.4 MB).' };
  }
  if (!minAndroid || minAndroid.length > 40) {
    return { valid: false, error: 'اكتب إصدار الأندرويد المطلوب (زي Android 8.0+).' };
  }
  if (!packageName || packageName.length > 100) {
    return { valid: false, error: 'اسم الحزمة مش مظبوط.' };
  }
  if (!/^https?:\/\//i.test(apkDownloadUrl) && !apkDownloadUrl.startsWith('/')) {
    return {
      valid: false,
      error: 'رابط التحميل لازم يبدأ بـ https:// أو http:// أو مسار محلي /.',
    };
  }
  if (heroTitle.length < 5 || heroSubtitle.length < 10) {
    return { valid: false, error: 'العنوان والوصف الرئيسي مطلوبين.' };
  }
  if (!/^https?:\/\//i.test(repoUrl)) {
    return { valid: false, error: 'رابط المستودع لازم يبدأ بـ https://.' };
  }

  return {
    valid: true,
    sanitized: {
      version,
      versionCode,
      fileSizeLabel,
      minAndroid,
      packageName,
      apkDownloadUrl,
      heroTitle,
      heroSubtitle,
      licenseNote: licenseNote || 'مجاني بالكامل · شغّال أوفلاين من غير نت',
      repoUrl,
      announcementText,
    },
  };
}
