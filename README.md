# ميزان الذكي &mdash; Smart Ledger & Invoicing Platform

منظومة مالية ومحاسبية متكاملة لإدارة التدفقات النقدية، القيود اليومية، وإصدار الفواتير الضريبية مع ربط حي وقوي بقاعدة بيانات **Neon Serverless PostgreSQL**.

---

## 🛡️ معايير الأمان والهندسة (Security & Architecture Compliance)
تم تدقيق هذا المشروع وتطويره بالاستناد إلى:
1. **NVIDIA SkillSpector**:
   - القضاء على ثغرات الـ SQL Injection عبر استخدام Tagged Templates المعزولة (`sql`...``) والاستعلامات ذات المعاملات (Parameterized Queries) بالكامل.
   - التحقق الصارم من صحة المدخلات الرقمية والنصية عند حدود الـ REST API.
2. **Addy Osmani Agent Standards & Vercel React Best Practices**:
   - بنية مكونات معيارية عالية الكفاءة في React 18 و Tailwind CSS.
   - دعم كامل للغة العربية (RTL) مع خط Cairo الاحترافي والتوافقية مع مقاييس الوصول WCAG 2.2.
   - لوحة تحكم متجاوبة تدعم التبديل اللحظي بين العملات (USD $, SAR ر.س, ILS ₪).

---

## 🚀 المميزات الرئيسية (Core Features)

- **📊 لوحة المؤشرات المالية (Executive Financial Dashboard):**
  - متابعة لحظية للإيرادات، المصروفات، وصافي الأرباح.
  - إحصائيات الفواتير غير المحصلة ومؤشرات التدفق النقدي.
- **💳 دفتر القيود والمعاملات (Transactions Ledger):**
  - تسجيل حركات الإيرادات والمصروفات، ربطها بالفئات المحاسبية والعملاء، وطرق الدفع.
  - فلاتر متقدمة وبحث فوري في القيود.
- **📄 نظام الفواتير والمطالبات (Tax Invoicing Suite):**
  - إصدار فواتير ضريبية ببنود ديناميكية متعددة وحساب آلي للضرائب والخصومات.
  - خاصية "تسجيل كسداد" الفورية التي تقوم بإيداع الإيراد تلقائياً في سجل المعاملات المالية.
  - نافذة معاينة وطباعة الفاتورة الرسمية (Print-ready Tax Invoice).
- **👥 دليل العملاء والشركاء (Clients Management):**
  - متابعة بيانات الشركاء وسجل الفواتير الصادرة لكل عميل.
- **📈 التقارير المالية (Financial Reports):**
  - تقرير هوامش الربحية التشغيلية وتوزيع المصروفات حسب الفئات.
- **⚡ تشخيص Neon PostgreSQL المباشر:**
  - مؤشر حالة حي يعرض سرعة الاستجابة (Latency بالملي ثانية) وحجم قاعدة البيانات السحابية.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend:** React 18, Vite 5, Tailwind CSS, Lucide Icons, Cairo & Plus Jakarta Fonts
- **Backend:** Node.js, Express, `@neondatabase/serverless`, CORS, dotenv
- **Database:** Neon Serverless PostgreSQL (AWS `us-east-2`)

---

## ⚙️ طريقة التشغيل السريع (Quick Start)

1. **تثبيت الحزم البرمجية:**
   ```bash
   npm install
   ```

2. **التأكد من إعدادات قاعدة البيانات في `.env`:**
   ```env
   DATABASE_URL=postgresql://...
   PORT=3001
   ```

3. **تشغيل الخادم والتطبيق:**
   ```bash
   # تشغيل خادم الـ API (المنفذ 3001)
   npm run server

   # تشغيل واجهة المستخدم (المنفذ 5173)
   npm run dev
   ```
