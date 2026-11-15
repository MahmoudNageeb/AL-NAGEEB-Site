export interface AppReleaseMeta {
  name: string;
  arabicName: string;
  packageName: string;
  version: string;
  versionCode: number;
  minAndroid: string;
  minSdk: number;
  targetSdk: number;
  fileSizeLabel: string;
  apkDownloadUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  licenseNote: string;
  repoUrl: string;
  announcementText: string;
}

export const APP_RELEASE_META: AppReleaseMeta = {
  name: 'AL NAGEEB',
  arabicName: 'النجيب — رفيقك الذكي للمذاكرة والتركيز',
  packageName: 'com.nageebstudyos.study',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '2.7',
  versionCode: 7,
  minAndroid: 'Android 8.0+',
  minSdk: 26,
  targetSdk: 36,
  fileSizeLabel: '38.4 MB',
  apkDownloadUrl:
    process.env.APK_DOWNLOAD_URL ||
    'https://github.com/MahmoudNageeb/AL-NAGEEB/releases/latest/download/AL-NAGEEB-v2.7.apk',
  heroTitle: 'تطبيق واحد يلمّلك مذاكرتك، ينظّم وقتك، ويحميك من التشتيت',
  heroSubtitle:
    'النجيب بيجمعلك موادك وملفاتك في مكتبة مترتبة، مع سبورة ذكية للشرح والتلخيص، ومؤقت ذكي يفتحلك وقت الترفيه على قد مذاكرتك — شغّال بالكامل على موبايلك من غير نت وبخصوصية تامة.',
  licenseNote: 'مجاني بالكامل · شغّال أوفلاين من غير نت',
  repoUrl: 'https://github.com/MahmoudNageeb/AL-NAGEEB',
  announcementText: '',
};

export interface AppCapability {
  id: string;
  dbId?: number;
  sortOrder?: number;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  accentHex: string;
  spanWide?: boolean;
  isVisible?: boolean;
}

export const CORE_CAPABILITIES: AppCapability[] = [
  {
    id: 'focus-os',
    index: '01',
    title: 'مؤقت التطبيقات ودرع منع التشتيت',
    subtitle: 'وقتك للترفيه مرتبط بإنجازك',
    description:
      'حدّد رصيد يومي لكل تطبيق على موبايلك أو خليه يبدأ بصفر ويفتحلك بالمذاكرة بس، مع عداد عائم بيعد قدامك لحظة بلحظة ويقفل التطبيق تلقائي أول ما الوقت يخلص، وبنظام قفل بيتجدد كل 24 ساعة.',
    highlights: [
      'مكافأة دقايق ترفيه تلقائي عن كل ساعة مذاكرة فعلية',
      'يوم راحة اختياري لكل تطبيق تقدر تاخده مرة كل أسبوع',
      'درع تشتيت بقوايم استثناء، تحدي طوارئ، وخزنة للإشعارات',
    ],
    accentHex: '#F0C97A',
    spanWide: true,
    isVisible: true,
  },
  {
    id: 'library',
    index: '02',
    title: 'مكتبة دراسية مترتبة لكل موادك',
    subtitle: 'فصل جوا وحدة جوا درس بلا حدود',
    description:
      'رتّب موادك بألوان واضحة ومجلدات متداخلة بالعمق اللي تحبه، مع 3 عدادات تقدم لكل درس (الفهم، الحفظ، والتدريبات) وقارئ PDF بيفكرك بآخر صفحة وقفت عندها لوحده.',
    highlights: [
      'استيراد آمن لملفاتك أو ربط مباشر بدون تكرار مساحة التخزين',
      'بحث سريع لحظي جوا المواد والدروس والملاحظات والوسوم',
    ],
    accentHex: '#7AD7F0',
    spanWide: false,
    isVisible: true,
  },
  {
    id: 'weekly-planner',
    index: '03',
    title: 'مخطط الأسبوع وتقييم الالتزام',
    subtitle: 'من السبت للجمعة برؤية واضحة',
    description:
      'كروت تفاعلية للأيام السبعة بتجمع مهامك مع المراجعات المتباعدة في مكان واحد، مع متابعة عاداتك اليومية وتحدي الأسبوع، وكمان يوم إجازة مبيتحسبش ضد تقييم التزامك.',
    highlights: [
      'ترحيل أي مهمة متأخرة لبكرة بضغطة واحدة',
      'تقييم أسبوعي واضح لالتزامك من 0 لحد 100%',
    ],
    accentHex: '#72D99B',
    spanWide: false,
    isVisible: true,
  },
  {
    id: 'whiteboard',
    index: '04',
    title: 'السبورة الذكية متعددة الطبقات',
    subtitle: 'ارسم، لخّص، واستخدم الأدوات الهندسية',
    description:
      'مساحة رسم مفتوحة فيها طبقات منفصلة، أقلام حبر وتظليل، تحديد ذكي (Lasso)، ومسطرة ومنقلة دقيقة، مع خلفيات سطور أو شبكة بيانية وتصدير فوري لصور أو PDF.',
    highlights: [
      'تسجيل صوتي وفيديو ومتصفح مدمج جوا اللوحة نفسها',
      'ربط مباشر بين اللوحات والدروس عشان ترجعلها بسهولة',
    ],
    accentHex: '#C7A4FF',
    spanWide: true,
    isVisible: true,
  },
  {
    id: 'offline-backup',
    index: '05',
    title: 'خصوصية 100% ونسخ احتياطي مضغوط',
    subtitle: 'كل بياناتك على جهازك لوحدك',
    description:
      'قاعدة بيانات محلية بتشتغل بالكامل من غير سيرفر خارجي ولا حساب، وتقدر تاخد نسخة احتياطية كاملة في ملف ZIP فيها كل دروسك وملفاتك وإعداداتك وتسترجعها في أي وقت.',
    highlights: [
      'اختيار ذكي بين الدمج مع البيانات الحالية أو الاستبدال الكامل',
      'واجهة عربية وإنجليزية كاملة مع 48 ثيم وأسلوب عرض مريح للعين',
    ],
    accentHex: '#FFC870',
    spanWide: false,
    isVisible: true,
  },
  {
    id: 'analytics',
    index: '06',
    title: 'إحصائيات وسجل جلسات المذاكرة',
    subtitle: 'شوف مجهودك الحقيقي بالأرقام',
    description:
      'لوحة متابعة بتوريك إجمالي ساعات التركيز، متوسطك اليومي، أطول سلسلة التزام (Streak)، وتوزيع وقتك على كل مادة مع سجل كامل لكل جلسة وملاحظاتها.',
    highlights: [
      'رسوم بيانية بسيطة توضّح وقتك خلال الأسبوع حسب المادة',
      'تحديث تلقائي لتقييم البطولة الأسبوعي أول ما تخلص جلستك',
    ],
    accentHex: '#F48FB1',
    spanWide: true,
    isVisible: true,
  },
];

export interface InstallStep {
  id?: number;
  stepOrder: number;
  title: string;
  detail: string;
  tip: string;
}

export const DEFAULT_INSTALL_STEPS: InstallStep[] = [
  {
    stepOrder: 1,
    title: 'نزّل ملف APK الرسمي',
    detail:
      'اضغط على زرار التحميل عشان تبدأ تنزيل النسخة الرسمية الموقّعة من تطبيق النجيب بصيغة APK على موبايلك.',
    tip: 'التطبيق مش محتاج تسجل حساب أو ترفع أي بيانات على الإنترنت.',
  },
  {
    stepOrder: 2,
    title: 'اسمح بالتثبيت من المتصفح',
    detail:
      'أول ما تفتح الملف، الأندرويد هيطلب منك السماح بالتثبيت من المصدر ده (المتصفح أو مدير الملفات). فعّل الخيار واضغط تثبيت.',
    tip: 'دي خطوة عادية ومطلوبة في أندرويد لأي تطبيق متنزّل مباشرة برا متجر Play.',
  },
  {
    stepOrder: 3,
    title: 'فعّل أذونات التركيز لو حبيت',
    detail:
      'بعد ما تفتح التطبيق، لو عايز تشغّل مؤقت التطبيقات ودرع التشتيت، اسمح بإذن إمكانية الوصول والظهور فوق التطبيقات.',
    tip: 'تقدر تستخدم المكتبة والسبورة ومخطط الأسبوع عادي من غير ما تفعّل أي أذونات إضافية.',
  },
  {
    stepOrder: 4,
    title: 'حدّث بأمان وبياناتك محفوظة',
    detail:
      'لما ينزل تحديث جديد من النجيب، ثبّت الـ APK الجديد فوق النسخة الموجودة على طول من غير ما تمسح القديم، وكل دروسك هتفضل زي ما هي.',
    tip: 'يفضّل تاخد نسخة احتياطية ZIP من الإعدادات قبل أي تحديث كبير للاطمئنان.',
  },
];

export interface AccentPreset {
  key: string;
  label: string;
  hex: string;
  secondaryHex: string;
}

export const APP_ACCENT_PRESETS: AccentPreset[] = [
  { key: 'gold', label: 'الذهبي الملكي', hex: '#F0C97A', secondaryHex: '#9AC2E6' },
  { key: 'emerald', label: 'الزمردي', hex: '#72D99B', secondaryHex: '#F0C97A' },
  { key: 'sky', label: 'الياقوتي السماوي', hex: '#7AD7F0', secondaryHex: '#C7A4FF' },
  { key: 'violet', label: 'الأرجواني الأكاديمي', hex: '#C7A4FF', secondaryHex: '#F48FB1' },
];

export interface WorkflowStep {
  step: string;
  title: string;
  detail: string;
}

export const GUIDE_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: '01',
    title: 'ثبّت التطبيق واضبط الأذونات اللي تحتاجها',
    detail:
      'نزّل النجيب على أي موبايل Android 8.0 أو أحدث. ولو ناوي تستخدم مؤقت التطبيقات أو درع التشتيت، فعّل خدمة إمكانية الوصول والظهور فوق التطبيقات عشان يقفل المشتتات في لحظتها.',
  },
  {
    step: '02',
    title: 'ابني مكتبة موادك ودروسك',
    detail:
      'أضف كل مادة بلون مميز ليها، وقسّمها وحدات وفصول ودروس، واربط بيها ملفات الـ PDF أو ملخصاتك مع متابعة نسب الفهم والحفظ والتدريبات.',
  },
  {
    step: '03',
    title: 'رتّب أسبوعك وعاداتك اليومية',
    detail:
      'من مخطط البطولة الأسبوعي (من السبت للجمعة)، حط هدف الأسبوع، حدد عاداتك الثابتة، واربط مهامك والمراجعات المتباعدة بالدروس نفسها.',
  },
  {
    step: '04',
    title: 'ابدأ جلسة تركيز واكسب وقت ترفيه',
    detail:
      'شغّل البومودورو أو المذاكرة العميقة (25/5 أو 50/10 أو 90/15) على الدرس اللي بتذاكره؛ كل دقيقة بتذاكرها بتتسجل للمادة وبتزود رصيدك في التطبيقات اللي بتراقبها.',
  },
];

export interface PermissionSpec {
  permission: string;
  arabicTitle: string;
  requiredFor: string;
  reason: string;
}

export const ANDROID_PERMISSIONS: PermissionSpec[] = [
  {
    permission: 'BIND_ACCESSIBILITY_SERVICE',
    arabicTitle: 'خدمة إمكانية الوصول',
    requiredFor: 'مؤقت التطبيقات ودرع التشتيت',
    reason:
      'بتتعرّف على فتح التطبيقات اللي ليها وقت محدد في أجزاء من الثانية وتقفلها أول ما الرصيد يخلص من غير ما تستهلك البطارية.',
  },
  {
    permission: 'SYSTEM_ALERT_WINDOW',
    arabicTitle: 'الظهور فوق التطبيقات الأخرى',
    requiredFor: 'العداد العائم الحي (MM:SS)',
    reason:
      'بتعرضلك شريط الوقت المتبقي الصغير فوق التطبيق اللي بتستخدمه وبتظهر شاشة التنبيه لما رصيدك يخلص.',
  },
  {
    permission: 'PACKAGE_USAGE_STATS',
    arabicTitle: 'إحصائيات استخدام التطبيقات',
    requiredFor: 'التوافق مع أنظمة الهواتف',
    reason:
      'آلية إضافية لضمان دقة عمل المؤقت على واجهات Samsung OneUI و Xiaomi HyperOS و OPPO ColorOS.',
  },
  {
    permission: 'BIND_NOTIFICATION_LISTENER_SERVICE',
    arabicTitle: 'إدارة الإشعارات وعدم الإزعاج',
    requiredFor: 'خزنة الإشعارات المحجوبة',
    reason:
      'بتكتم الإشعارات المشتتة وقت المذاكرة وتحفظها في الخزنة جوا التطبيق عشان تراجعها براحتك بعد ما تخلّص.',
  },
  {
    permission: 'FOREGROUND_SERVICE & SCHEDULE_EXACT_ALARM',
    arabicTitle: 'الخدمة الأمامية والتنبيهات الدقيقة',
    requiredFor: 'المؤقت وتنبيهات المراجعة',
    reason:
      'بتضمن إن مؤقت المذاكرة يكمل عد بدقة حتى لو قفلت الشاشة، وإن تنبيهات المهام والمراجعات توصلك في ميعادها بالضبط.',
  },
];

export interface ChangelogEntry {
  id?: number;
  sortOrder?: number;
  version: string;
  date: string;
  headline: string;
  changes: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    sortOrder: 1,
    version: 'v2.7',
    date: 'الإصدار الحالي',
    headline: 'تطوير شامل لدرع التركيز، السبورة الهندسية، ومخطط الأسبوع',
    changes: [
      'إطلاق القفل المتجدد تلقائياً كل 24 ساعة في مؤقت التطبيقات مع يوم راحة اختياري كل أسبوع.',
      'دمج المراجعات المتباعدة مباشرة جوا بطاقات الأيام السبعة وعداد الإنجاز.',
      'إضافة أدوات الهندسة والتحديد الذكي (Lasso) وتصدير الفيديو والصور في السبورة الذكية.',
      'تطوير النسخ الاحتياطي الكامل بصيغة ZIP ليشمل قاعدة البيانات والملفات المستوردة وكل الإعدادات.',
    ],
  },
  {
    sortOrder: 2,
    version: 'v2.4',
    date: 'تحديث التصميم',
    headline: 'هوية Academic Velvet و48 باليت لوني مريح للعين',
    changes: [
      'بناء الواجهات بنظام Academic Velvet مع أربعة أوضاع عرض (داكن، فاتح، AMOLED، ومنتصف الليل).',
      'إضافة قارئ PDF مدمج بيحفظ آخر صفحة وصلت ليها ويربط الملفات بالدروس.',
    ],
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const GUIDE_FAQS: FaqItem[] = [
  {
    question: 'هل تطبيق النجيب محتاج نت أو تسجيل حساب عشان يشتغل؟',
    answer:
      'لأ خالص، التطبيق شغّال 100% أوفلاين من غير نت ومن غير ما تعمل حساب. كل دروسك وملفاتك وسجلات المذاكرة محفوظة محلياً على موبايلك بس.',
  },
  {
    question: 'ازاي أحافظ على بياناتي لو غيرت الموبايل أو فرمت الجهاز؟',
    answer:
      'من الإعدادات جوا التطبيق تقدر تصدّر نسخة احتياطية مضغوطة (ZIP) بضغطة واحدة فيها قاعدة البيانات وكل الملفات المستوردة، وترجعها بعدين بوضع الدمج أو الاستبدال الكامل.',
  },
  {
    question: 'لو شغّلت القفل المتجدد في مؤقت التطبيقات، ينفع أفكّه لحظياً؟',
    answer:
      'لأ، فكرته إنه يحميك في لحظات الملل؛ القفل بيكمل دورة الـ 24 ساعة كاملة قبل ما يسمحلك تزود وقت أو تحذف التقييد، لكن تقدر في أي وقت تقلل الوقت أو المكافأة.',
  },
  {
    question: 'ازاي باخد دقايق زيادة للتطبيقات الترفيهية؟',
    answer:
      'كل ساعة مذاكرة حقيقية بتخلصها على مؤقت التركيز بتزود تلقائي الدقايق اللي حددتها في رصيد التطبيق، والرصيد الإضافي بيتصفّر عند نص الليل عشان تبدأ يومك الجديد منظم.',
  },
  {
    question: 'إيه أقل إصدار أندرويد يقدر يشغّل التطبيق؟',
    answer:
      'التطبيق بيشتغل بسلاسة على Android 8.0 (API 26) أو أحدث، ومبني بأحدث تقنيات Jetpack Compose و Material Design 3.',
  },
];
