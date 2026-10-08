import express from 'express';
import cors from 'cors';
import { sql, initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB schema on server boot
initDatabase().catch(err => {
  console.error("Failed to bootstrap database on server start:", err);
});

// 1. Health & Database Diagnostic Ping
app.get('/api/health', async (req, res) => {
  try {
    const startTime = performance.now();
    const versionRes = await sql`SELECT version(), current_database(), current_user, pg_database_size(current_database()) as db_bytes;`;
    const latency = (performance.now() - startTime).toFixed(2);

    res.json({
      status: 'online',
      latencyMs: parseFloat(latency),
      database: versionRes[0].current_database,
      user: versionRes[0].current_user,
      postgresVersion: versionRes[0].version.split(' ')[1],
      dbSizeBytes: parseInt(versionRes[0].db_bytes),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Executive Dashboard KPI Metrics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const incomeRes = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_income 
      FROM transactions 
      WHERE type = 'income';
    `;
    const expenseRes = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_expense 
      FROM transactions 
      WHERE type = 'expense';
    `;
    const invoiceStats = await sql`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM invoices;
    `;
    const clientCountRes = await sql`SELECT COUNT(*) as total_clients FROM clients;`;

    const totalIncome = parseFloat(incomeRes[0].total_income);
    const totalExpense = parseFloat(expenseRes[0].total_expense);
    const netProfit = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      netProfit,
      totalInvoices: parseInt(invoiceStats[0].total_invoices),
      paidAmount: parseFloat(invoiceStats[0].paid_amount),
      pendingAmount: parseFloat(invoiceStats[0].pending_amount),
      pendingCount: parseInt(invoiceStats[0].pending_count),
      totalClients: parseInt(clientCountRes[0].total_clients)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Transactions - Get All with filters
app.get('/api/transactions', async (req, res) => {
  try {
    const { type, limit } = req.query;
    const maxRows = parseInt(limit) || 100;

    let query;
    if (type && (type === 'income' || type === 'expense')) {
      query = await sql`
        SELECT 
          t.*,
          c.name as category_name,
          c.color as category_color,
          cl.name as client_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN clients cl ON t.client_id = cl.id
        WHERE t.type = ${type}
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT ${maxRows};
      `;
    } else {
      query = await sql`
        SELECT 
          t.*,
          c.name as category_name,
          c.color as category_color,
          cl.name as client_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN clients cl ON t.client_id = cl.id
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT ${maxRows};
      `;
    }
    res.json(query);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Transactions - Create new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { title, type, amount, category_id, client_id, payment_method, transaction_date, notes } = req.body;

    if (!title || !type || !amount) {
      return res.status(400).json({ error: "Title, type ('income'|'expense') and amount are required" });
    }

    const inserted = await sql`
      INSERT INTO transactions (
        title, type, amount, category_id, client_id, payment_method, transaction_date, notes
      )
      VALUES (
        ${title},
        ${type},
        ${parseFloat(amount)},
        ${category_id ? parseInt(category_id) : null},
        ${client_id ? parseInt(client_id) : null},
        ${payment_method || 'Cash'},
        ${transaction_date ? new Date(transaction_date) : new Date()},
        ${notes || null}
      )
      RETURNING *;
    `;
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Transactions - Delete
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await sql`DELETE FROM transactions WHERE id = ${id};`;
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Invoices - Get All
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await sql`
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.company as client_company,
        COALESCE(
          json_agg(
            json_build_object(
              'id', items.id,
              'description', items.description,
              'quantity', items.quantity,
              'unit_price', items.unit_price,
              'total', items.total
            )
          ) FILTER (WHERE items.id IS NOT NULL), '[]'
        ) as items
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN invoice_items items ON i.id = items.invoice_id
      GROUP BY i.id, c.id
      ORDER BY i.created_at DESC;
    `;
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Invoices - Create Invoice with dynamic items
app.post('/api/invoices', async (req, res) => {
  try {
    const { client_id, invoice_number, issue_date, due_date, items, tax_rate, discount, notes } = req.body;

    if (!client_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "client_id and at least one item are required" });
    }

    const calculatedSubtotal = items.reduce((acc, it) => acc + (parseFloat(it.quantity) * parseFloat(it.unit_price)), 0);
    const effectiveTaxRate = parseFloat(tax_rate || 15);
    const effectiveDiscount = parseFloat(discount || 0);
    const taxAmount = (calculatedSubtotal * effectiveTaxRate) / 100;
    const finalTotal = calculatedSubtotal + taxAmount - effectiveDiscount;

    const num = invoice_number || `INV-${Date.now().toString().slice(-6)}`;

    const newInvoice = await sql`
      INSERT INTO invoices (
        invoice_number, client_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total_amount, status, notes
      )
      VALUES (
        ${num},
        ${parseInt(client_id)},
        ${issue_date ? new Date(issue_date) : new Date()},
        ${due_date ? new Date(due_date) : new Date(Date.now() + 14 * 86400000)},
        ${calculatedSubtotal},
        ${effectiveTaxRate},
        ${taxAmount},
        ${effectiveDiscount},
        ${finalTotal},
        'pending',
        ${notes || ''}
      )
      RETURNING *;
    `;

    const invId = newInvoice[0].id;

    for (const it of items) {
      const itQty = parseFloat(it.quantity || 1);
      const itPrice = parseFloat(it.unit_price || 0);
      const itTotal = itQty * itPrice;
      await sql`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
        VALUES (${invId}, ${it.description || 'Service'}, ${itQty}, ${itPrice}, ${itTotal});
      `;
    }

    res.status(201).json(newInvoice[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Invoices - Update status
app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['draft', 'pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updated = await sql`
      UPDATE invoices
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *;
    `;

    // If marked paid, automatically log income transaction
    if (status === 'paid' && updated.length > 0) {
      const inv = updated[0];
      await sql`
        INSERT INTO transactions (title, type, amount, client_id, payment_method, notes)
        VALUES (
          ${'تحصيل فاتورة ' + inv.invoice_number},
          'income',
          ${inv.total_amount},
          ${inv.client_id},
          'Bank Transfer',
          'سداد تلقائي للفاتورة'
        );
      `;
    }

    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Invoices - Delete
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await sql`DELETE FROM invoices WHERE id = ${id};`;
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Clients - Get All
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT i.id) as total_invoices,
        COALESCE(SUM(i.total_amount), 0) as total_invoiced
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id
      GROUP BY c.id
      ORDER BY c.name ASC;
    `;
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Clients - Create new client
app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, phone, company, balance } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Client name is required" });
    }

    const inserted = await sql`
      INSERT INTO clients (name, email, phone, company, balance)
      VALUES (${name}, ${email || null}, ${phone || null}, ${company || null}, ${parseFloat(balance || 0)})
      RETURNING *;
    `;
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Categories - Get All
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await sql`SELECT * FROM categories ORDER BY name ASC;`;
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Financial Reports & Breakdown Analytics
app.get('/api/reports/summary', async (req, res) => {
  try {
    const categoryBreakdown = await sql`
      SELECT 
        c.name as category,
        c.type,
        c.color,
        COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      GROUP BY c.id
      ORDER BY total DESC;
    `;

    const monthlyBreakdown = await sql`
      SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY month ASC
      LIMIT 6;
    `;

    res.json({
      categoryBreakdown,
      monthlyBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Smart Accounting API Server is running on port ${PORT}`);
});
