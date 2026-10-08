import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("FATAL: DATABASE_URL is not set in .env file.");
  process.exit(1);
}

// Instantiate serverless SQL driver
export const sql = neon(dbUrl);

/**
 * Initializes the database schema for the Smart Accounting & Invoicing System
 */
export async function initDatabase() {
  try {
    console.log("Connecting to Neon PostgreSQL and creating accounting tables...");

    // 1. Clients Table
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(50),
        company VARCHAR(150),
        balance NUMERIC(12, 2) DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Categories Table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        color VARCHAR(30) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'Tag',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Transactions Table (Income & Expenses Ledger)
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        amount NUMERIC(12, 2) NOT NULL,
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        client_id INT REFERENCES clients(id) ON DELETE SET NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        transaction_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Invoices Table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        client_id INT REFERENCES clients(id) ON DELETE CASCADE,
        issue_date DATE DEFAULT CURRENT_DATE,
        due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
        subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        tax_rate NUMERIC(5, 2) DEFAULT 15.00,
        tax_amount NUMERIC(12, 2) DEFAULT 0.00,
        discount NUMERIC(12, 2) DEFAULT 0.00,
        total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 5. Invoice Items Table
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
        unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0.00
      );
    `;

    // Check if initial categories exist, otherwise seed initial data
    const existingCategories = await sql`SELECT count(*) FROM categories;`;
    if (parseInt(existingCategories[0].count) === 0) {
      console.log("Seeding default accounting categories and sample records...");

      // Seed Categories
      const insertedCats = await sql`
        INSERT INTO categories (name, type, color, icon)
        VALUES 
          ('مبيعات وخدمات برمجية', 'income', '#10b981', 'Code'),
          ('استشارات تقنية وحلول سحابية', 'income', '#06b6d4', 'Server'),
          ('عقود صيانة ودعم فني', 'income', '#3b82f6', 'ShieldCheck'),
          ('رواتب ومستحقات فريق العمل', 'expense', '#ef4444', 'Users'),
          ('اشتراكات سحابية وسيرفرات (AWS/Neon)', 'expense', '#f59e0b', 'Cloud'),
          ('تسويق وحملات إعلانية', 'expense', '#8b5cf6', 'Megaphone'),
          ('مصاريف تشغيلية ومكتبية', 'expense', '#64748b', 'Building')
        RETURNING id, name, type;
      `;

      // Seed Clients
      const insertedClients = await sql`
        INSERT INTO clients (name, email, phone, company, balance)
        VALUES
          ('شركة التقنية المتطورة', 'contact@techadvanced.com', '+966 50 123 4567', 'Tech Advanced Ltd', 3500.00),
          ('مؤسسة الأفق للحلول الرقمية', 'info@alofoq-digital.com', '+966 55 987 6543', 'Alofoq Group', 0.00),
          ('منصة الريادة للتجارة الإلكترونية', 'finance@riyada-store.com', '+970 59 111 2233', 'Riyada E-Commerce', 5200.00),
          ('مكتب الشروق للاستشارات', 'office@alshorouq.net', '+966 53 444 5555', 'Alshorouq Consult', 0.00)
        RETURNING id, name;
      `;

      const c1 = insertedClients[0].id;
      const c2 = insertedClients[1].id;
      const c3 = insertedClients[2].id;

      // Seed Invoices
      const inv1 = await sql`
        INSERT INTO invoices (invoice_number, client_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total_amount, status, notes)
        VALUES 
          ('INV-2026-001', ${c1}, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 3000.00, 15.00, 450.00, 0.00, 3450.00, 'pending', 'دفعة تطوير تطبيق الويب والنظام السحابي')
        RETURNING id;
      `;

      const inv2 = await sql`
        INSERT INTO invoices (invoice_number, client_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total_amount, status, notes)
        VALUES 
          ('INV-2026-002', ${c2}, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '5 days', 6500.00, 15.00, 975.00, 500.00, 6975.00, 'paid', 'عقد بناء الواجهات البرمجية وتكامل Neon Postgres')
        RETURNING id;
      `;

      const inv3 = await sql`
        INSERT INTO invoices (invoice_number, client_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total_amount, status, notes)
        VALUES 
          ('INV-2026-003', ${c3}, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 4500.00, 15.00, 675.00, 0.00, 5175.00, 'pending', 'تصميم وتطوير لوحة تحكم ذكية متجاوبة')
        RETURNING id;
      `;

      // Seed Invoice Items
      await sql`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
        VALUES
          (${inv1[0].id}, 'تطوير واجهة مستخدم تفاعلية React 18', 1, 1800.00, 1800.00),
          (${inv1[0].id}, 'هيكلة وتكامل قاعدة بيانات Neon Serverless', 1, 1200.00, 1200.00),
          (${inv2[0].id}, 'برمجة واجهات RESTful APIs سريعة', 1, 3500.00, 3500.00),
          (${inv2[0].id}, 'فحص الأمان والحماية وفق معايير SkillSpector', 1, 3000.00, 3000.00),
          (${inv3[0].id}, 'تصميم وتكامل نظام الفوترة والتقارير المالية', 1, 4500.00, 4500.00);
      `;

      // Seed Transactions
      const catDev = insertedCats[0].id;
      const catServer = insertedCats[4].id;
      const catSalary = insertedCats[3].id;

      await sql`
        INSERT INTO transactions (title, type, amount, category_id, client_id, payment_method, transaction_date, notes)
        VALUES
          ('دفعة مستلمة من فاتورة INV-2026-002', 'income', 6975.00, ${catDev}, ${c2}, 'Bank Transfer', CURRENT_DATE - INTERVAL '5 days', 'تحويل بنكي فوري لحساب المؤسسة'),
          ('تجديد اشتراك خوادم الحوسبة وقاعدة بيانات Neon', 'expense', 185.00, ${catServer}, NULL, 'Credit Card', CURRENT_DATE - INTERVAL '7 days', 'خطة سحابية إنتاجية AWS us-east-2'),
          ('رواتب المهندسين لشهر أكتوبر', 'expense', 4200.00, ${catSalary}, NULL, 'Bank Transfer', CURRENT_DATE - INTERVAL '8 days', 'تحويل الراتب الشهري للمطورين'),
          ('دفعة مقدمة - مشروع المنصة الرقمية', 'income', 2500.00, ${catDev}, ${c1}, 'Cash', CURRENT_DATE - INTERVAL '12 days', 'دفعة نقدية معتمدة');
      `;
    }

    console.log("Accounting database schema validated & ready.");
  } catch (err) {
    console.error("Database schema init error:", err);
    throw err;
  }
}
