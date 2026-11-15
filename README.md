<div align="center">

# 🌙 AL NAGEEB | النجيب — الموقع الرسمي ومنظومة الإدارة

**الموقع الرسمي ومنصة التوزيع والتحليلات لتطبيق النجيب (AL NAGEEB) للأندرويد**

*واجهة عربية متكاملة بهوية **Academic Velvet** · لوحة تحكم ديناميكية · إشعارات Web Push فورية · تحليلات زوار وتحميلات بالرسم البياني*

[![Next.js](https://img.shields.io/badge/Next.js-15.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Web Push](https://img.shields.io/badge/Web_Push-VAPID-F0C97A?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

</div>

---

## نظرة عامة

يمثّل هذا المستودع **البوابة الرسمية الكاملة لتطبيق النجيب (`com.nageebstudyos.study`)**، وهو مصمم ليقدّم تجربة تعريف وتنزيل احترافية للطلاب مع لوحة تحكم شاملة لإدارة المحتوى، متابعة الإحصائيات الحقيقية، وإرسال الإشعارات الفورية للمستخدمين دون الحاجة لأي إعادة نشر عند تعديل النصوص أو روابط التحميل.

---

## المميزات والأنظمة الرئيسية

### 1. تجربة تصفح فاخرة وحركات تفاعلية (Motion & UI Architecture)
- **هوية Academic Velvet**: دعم كامل للوضعين **الداكن (Velvet Dark)** و**الفاتح (Ivory Light)** عبر متغيرات CSS مخصصة.
- **حركات دقيقة ومتزنة (`motion/react`)**: شريط تقدم القراءة العلوي، مؤثرات تتبع المؤشر (`SpotlightCard` و`MagneticButton`)، انتقالات بين الصفحات، وشريط صلاة على النبي ﷺ في أعلى الهيدر.
- **خطوط عربية وهندسية متناغمة**: `Cairo` للعناوين، `Tajawal` للنصوص، `Amiri` للخط العربي التراثي، و`JetBrains Mono` للأرقام الجدولية (`tabular-nums`).

### 2. صفحات الموقع العامة
| المسار | الوظيفة |
| :--- | :--- |
| `/` | الصفحة الرئيسية: عرض تعريفي تفاعلي، مواصفات الإصدار الحالي، تبويبات الأنظمة، شريط المميزات المتحرك، وبطاقات التنقل. |
| `/features` | استعراض الأنظمة الستة الأساسية للتطبيق ديناميكياً من قاعدة البيانات مع إمكانية الترتيب والإخفاء من الأدمن. |
| `/install` | دليل التثبيت خطوة بخطوة مع شريط متابعة التقدم + **دليل مصوّر تفاعلي (4 خطوات بالتكبير)** لتجاوز تحذير Google Play Protect مؤقتاً والتذكير بإعادة تفعيله بعد التثبيت. |
| `/opinions` | مجتمع آراء وتجارب الطلاب: إضافة رأي، التصفية والبحث والترتيب، التصويت المفيد (متزامن مع قاعدة البيانات)، وتمييز الآراء المثبتة. |
| `/guide` | الدليل الشامل: آلية عمل التطبيق، تفاصيل الأذونات التقنية في أندرويد، سجل الإصدارات (`Changelog`)، والأسئلة الشائعة. |
| `/login` | بوابة تسجيل الدخول وإنشاء الحسابات، مع شاشة إعداد أولي لحساب المالك عند التشغيل الأول. |
| `/admin` | لوحة التحكم الإدارية المحمية بصلاحيات الأدمن لإدارة كل جزء في الموقع. |

### 3. لوحة تحكم الأدمن (`/admin`)
- **التحكم الكامل بالإصدار والتحميل**: تعديل رقم الإصدار، `versionCode`، حجم الملف، أقل إصدار أندرويد، رابط تحميل APK المباشر، نصوص الواجهة الرئيسية، وإعلان أعلى الموقع.
- **إدارة المحتوى الديناميكي (CMS)**: إضافة وتعديل وحذف وترتيب المميزات، خطوات التثبيت، وسجل التحديثات.
- **إدارة الآراء والحسابات**: تثبيت/تمييز الآراء، تعديلها أو حذفها، وترقية/إدارة المستخدمين وحساب الأدمن وكلمة المرور.

### 4. نظام التحليلات والرسم البياني الحقيقي (`Analytics Engine`)
- **تتبع صامت في الخلفية (`VisitTracker`)**: يسجل الزيارات الحقيقية والزوار الفريدين على الصفحات العامة فقط (يستبعد `/admin` و`/api` وطلبات الـ `prefetch` مع فترة تهدئة لمنع التكرار اللحظي).
- **تتبع التحميلات (`/api/download`)**: يسجل كل ضغطة تحميل فعلية لملف الـ APK قبل التحويل (`302 Redirect`).
- **رسم بياني تفاعلي عالي الدقة (`TrafficAnalyticsChart`)**:
  - مبني على **HiDPI Canvas** متجاوب مع تغيير المقاس والوضع الداكن/الفاتح لحظياً.
  - وضعان للعرض: **منحنى انسيابي (Monotonic Spline Area)** و**أعمدة مقارنة (Grouped Bars)**.
  - تصفية زمنية (**7 / 14 / 30 يوم**) وتصفية السلاسل (**الكل / الزوار / التحميلات**).
  - مؤشر مسح تفاعلي (`Scrub Crosshair`) وكارت تفاصيل عائم لكل يوم + حساب متوسطات الأداء، يوم الذروة، ونسبة التحويل للتحميل، وقائمة **أكثر الصفحات زيارة**.

### 5. نظام الإشعارات الفورية (`Web Push + In-App Feed`)
- دعم كامل لإشعارات المتصفح الحقيقية عبر **Service Worker** (`/public/sw.js`) و`web-push` مع بروتوكول **VAPID**.
- توليد وحفظ مفاتيح `VAPID` تلقائياً في PostgreSQL إذا لم تُضف يدوياً في متغيرات البيئة.
- جرس إشعارات ذكي في الشريط العلوي (`NotificationBell`) يعرض سجل الإشعارات المرسلة، حالة التفعيل، وتحديثات فورية حتى لو المتصفح في الخلفية.
- نافذة إرسال إشعار جماعي للأدمن مع قوالب سريعة، اختيار رابط الوجهة، وعدّاد المستلمين.

---

## الأمان وهندسة البيانات

- **مصادقة آمنة**: كلمات مرور مشفرة بـ `crypto.scrypt` مع `timingSafeEqual`، وجلسات موقّعة بـ `HMAC-SHA256` في كوكيز `HttpOnly` متوافقة مع `SameSite=None; Secure; Partitioned` لبيئات HTTPS وiFrame.
- **قاعدة بيانات PostgreSQL ذاتية التهيئة (`lib/db.ts`)**: يتم إنشاء الجداول والفهارس تلقائياً وبأمان (`CREATE TABLE IF NOT EXISTS`) دون فقدان أي بيانات عند الترقية:
  - `app_users` — الحسابات والصلاحيات (`admin` / `user`)
  - `app_settings` — إعدادات الإصدار ورابط الـ APK ونصوص الهيرو
  - `app_capabilities` — المميزات الديناميكية وترتيبها
  - `app_install_steps` — خطوات التثبيت
  - `app_changelog` — سجل الإصدارات
  - `reviews` و `review_helpful_votes` — آراء الطلاب والتصويت
  - `push_vapid_keys` و `push_subscribers` و `broadcast_notifications` — منظومة الإشعارات
  - `site_visitors` و `site_daily_visits` و `site_path_stats` و `download_events` — التحليلات الزمنية وتوزيع الصفحات والتحميلات

---

## التقنيات المستخدمة (Tech Stack)

| الطبقة | التقنية |
| :--- | :--- |
| **إطار العمل** | Next.js `15.4` (App Router + Server Actions + Route Handlers) |
| **الواجهة واللغة** | React `19.2`, TypeScript `5.9` |
| **التنسيق والحركة** | Tailwind CSS `v4`, Motion `12.23`, Lucide React `0.553` |
| **قاعدة البيانات** | PostgreSQL (`pg` Pool + `@vercel/functions`) متوافق مع Neon Serverless |
| **الإشعارات الفورية** | `web-push` `4.0` + Custom Service Worker (`/public/sw.js`) |
| **الاختبارات** | Node.js Test Runner (`node:test`) عبر `tsx` |

---

## هيكل المشروع

```text
├── app/
│   ├── actions.ts                 # Server Actions (CMS، الآراء، المستخدمين، الإشعارات)
│   ├── layout.tsx & template.tsx  # الهيكل العام، الخطوط، التتبع، وانتقالات الصفحات
│   ├── globals.css                # نظام الألوان Academic Velvet والحركات
│   ├── page.tsx                   # الصفحة الرئيسية
│   ├── features/page.tsx          # صفحة المميزات
│   ├── install/page.tsx           # صفحة التثبيت ودليل Play Protect
│   ├── opinions/page.tsx          # صفحة آراء الطلاب
│   ├── guide/page.tsx             # صفحة الدليل والأذونات والأسئلة الشائعة
│   ├── login/page.tsx             # تسجيل الدخول وإعداد المالك الأولي
│   ├── admin/page.tsx             # لوحة تحكم الأدمن
│   └── api/
│       ├── auth/route.ts          # مصادقة الجلسات وتسجيل الخروج
│       ├── download/route.ts      # تسجيل التحميل وإعادة التوجيه لملف APK
│       ├── analytics/
│       │   ├── visit/route.ts     # تسجيل الزيارات العامة اليومية
│       │   └── stats/route.ts     # جلب الإحصائيات والبيانات الزمنية للأدمن
│       └── notifications/
│           ├── vapid-public-key/route.ts
│           ├── subscribe/route.ts
│           ├── unsubscribe/route.ts
│           └── feed/route.ts
├── components/
│   ├── AdminDashboard.tsx         # واجهة الإدارة الشاملة
│   ├── TrafficAnalyticsChart.tsx  # الرسم البياني الاحترافي (Canvas HiDPI)
│   ├── PlayProtectGuide.tsx       # شرح مصور لإيقاف وإعادة تفعيل Play Protect
│   ├── NotificationBell.tsx       # جرس واشتراك الإشعارات الفورية
│   ├── VisitTracker.tsx           # متتبع الزيارات الصامت
│   └── ...                        # بقية مكونات الصفحات والواجهات التفاعلية
├── lib/
│   ├── db.ts                      # اتصال PostgreSQL والتهيئة الذاتية والاستعلامات
│   ├── session.ts                 # إدارة جلسات الكوكيز الآمنة
│   ├── push-sender.ts             # إرسال إشعارات Web Push الجماعية
│   ├── analytics-logic.ts         # منطق التحليلات والسلاسل الزمنية (+ اختبارات)
│   ├── auth-logic.ts              # منطق التشفير والتحقق (+ اختبارات)
│   ├── notifications-logic.ts     # منطق الإشعارات (+ اختبارات)
│   ├── reviews-logic.ts           # منطق الآراء والإعدادات (+ اختبارات)
│   └── study-app-data.ts          # البيانات الافتراضية ومواصفات التطبيق
└── public/
    ├── sw.js                      # Service Worker لاستقبال وعرض إشعارات الدفع
    ├── icon.svg                   # أيقونة الموقع والإشعارات
    └── assets/aistudio/           # لقطات شاشة شرح Google Play Protect
