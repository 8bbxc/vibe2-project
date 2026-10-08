import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: "DATABASE_URL environment variable is missing" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sql = neon(dbUrl);

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/?/, '');
    const method = req.method;

    // 1. Health Ping (/api/health)
    if (path === 'health' || path === 'health/') {
      const startTime = performance.now();
      const versionRes = await sql`SELECT version(), current_database(), current_user, pg_database_size(current_database()) as db_bytes;`;
      const latency = (performance.now() - startTime).toFixed(2);

      return new Response(JSON.stringify({
        status: 'online',
        latencyMs: parseFloat(latency),
        database: versionRes[0].current_database,
        user: versionRes[0].current_user,
        postgresVersion: versionRes[0].version.split(' ')[1],
        dbSizeBytes: parseInt(versionRes[0].db_bytes),
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Dashboard KPIs (/api/dashboard/stats)
    if (path === 'dashboard/stats' || path === 'dashboard/stats/') {
      const incomeRes = await sql`SELECT COALESCE(SUM(amount), 0) as total_income FROM transactions WHERE type = 'income';`;
      const expenseRes = await sql`SELECT COALESCE(SUM(amount), 0) as total_expense FROM transactions WHERE type = 'expense';`;
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

      return new Response(JSON.stringify({
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        totalInvoices: parseInt(invoiceStats[0].total_invoices),
        paidAmount: parseFloat(invoiceStats[0].paid_amount),
        pendingAmount: parseFloat(invoiceStats[0].pending_amount),
        pendingCount: parseInt(invoiceStats[0].pending_count),
        totalClients: parseInt(clientCountRes[0].total_clients)
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Transactions (/api/transactions)
    if (path === 'transactions' || path === 'transactions/') {
      if (method === 'GET') {
        const type = url.searchParams.get('type');
        let query;
        if (type && (type === 'income' || type === 'expense')) {
          query = await sql`
            SELECT t.*, c.name as category_name, c.color as category_color, cl.name as client_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN clients cl ON t.client_id = cl.id
            WHERE t.type = ${type}
            ORDER BY t.transaction_date DESC, t.id DESC
            LIMIT 100;
          `;
        } else {
          query = await sql`
            SELECT t.*, c.name as category_name, c.color as category_color, cl.name as client_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN clients cl ON t.client_id = cl.id
            ORDER BY t.transaction_date DESC, t.id DESC
            LIMIT 100;
          `;
        }
        return new Response(JSON.stringify(query), { headers: { 'Content-Type': 'application/json' } });
      }

      if (method === 'POST') {
        const body = await req.json();
        const { title, type, amount, category_id, client_id, payment_method, transaction_date, notes } = body;
        const inserted = await sql`
          INSERT INTO transactions (title, type, amount, category_id, client_id, payment_method, transaction_date, notes)
          VALUES (
            ${title}, ${type}, ${parseFloat(amount)},
            ${category_id ? parseInt(category_id) : null},
            ${client_id ? parseInt(client_id) : null},
            ${payment_method || 'Cash'},
            ${transaction_date ? new Date(transaction_date) : new Date()},
            ${notes || null}
          )
          RETURNING *;
        `;
        return new Response(JSON.stringify(inserted[0]), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Delete transaction (/api/transactions/:id)
    const txDeleteMatch = path.match(/^transactions\/(\d+)\/?$/);
    if (txDeleteMatch && method === 'DELETE') {
      const id = parseInt(txDeleteMatch[1]);
      await sql`DELETE FROM transactions WHERE id = ${id};`;
      return new Response(JSON.stringify({ message: "Deleted" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Invoices (/api/invoices)
    if (path === 'invoices' || path === 'invoices/') {
      if (method === 'GET') {
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
        return new Response(JSON.stringify(invoices), { headers: { 'Content-Type': 'application/json' } });
      }

      if (method === 'POST') {
        const body = await req.json();
        const { client_id, invoice_number, issue_date, due_date, items, tax_rate, discount, notes } = body;

        const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.quantity) * parseFloat(it.unit_price)), 0);
        const taxRate = parseFloat(tax_rate || 15);
        const disc = parseFloat(discount || 0);
        const taxAmt = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmt - disc;
        const num = invoice_number || `INV-${Date.now().toString().slice(-6)}`;

        const newInv = await sql`
          INSERT INTO invoices (invoice_number, client_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total_amount, status, notes)
          VALUES (${num}, ${parseInt(client_id)}, ${issue_date ? new Date(issue_date) : new Date()}, ${due_date ? new Date(due_date) : new Date(Date.now() + 14 * 86400000)}, ${subtotal}, ${taxRate}, ${taxAmt}, ${disc}, ${total}, 'pending', ${notes || ''})
          RETURNING *;
        `;

        for (const it of items) {
          const qty = parseFloat(it.quantity || 1);
          const pr = parseFloat(it.unit_price || 0);
          await sql`INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (${newInv[0].id}, ${it.description || 'Service'}, ${qty}, ${pr}, ${qty * pr});`;
        }

        return new Response(JSON.stringify(newInv[0]), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Update invoice status (/api/invoices/:id/status)
    const invStatusMatch = path.match(/^invoices\/(\d+)\/status\/?$/);
    if (invStatusMatch && method === 'PATCH') {
      const id = parseInt(invStatusMatch[1]);
      const { status } = await req.json();
      const updated = await sql`UPDATE invoices SET status = ${status} WHERE id = ${id} RETURNING *;`;
      if (status === 'paid' && updated.length > 0) {
        await sql`
          INSERT INTO transactions (title, type, amount, client_id, payment_method, notes)
          VALUES (${'تحصيل فاتورة ' + updated[0].invoice_number}, 'income', ${updated[0].total_amount}, ${updated[0].client_id}, 'Bank Transfer', 'سداد فاتورة');
        `;
      }
      return new Response(JSON.stringify(updated[0]), { headers: { 'Content-Type': 'application/json' } });
    }

    // Delete invoice (/api/invoices/:id)
    const invDeleteMatch = path.match(/^invoices\/(\d+)\/?$/);
    if (invDeleteMatch && method === 'DELETE') {
      const id = parseInt(invDeleteMatch[1]);
      await sql`DELETE FROM invoices WHERE id = ${id};`;
      return new Response(JSON.stringify({ message: "Deleted" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 5. Clients (/api/clients)
    if (path === 'clients' || path === 'clients/') {
      if (method === 'GET') {
        const clients = await sql`
          SELECT c.*, COUNT(DISTINCT i.id) as total_invoices, COALESCE(SUM(i.total_amount), 0) as total_invoiced
          FROM clients c
          LEFT JOIN invoices i ON c.id = i.client_id
          GROUP BY c.id
          ORDER BY c.name ASC;
        `;
        return new Response(JSON.stringify(clients), { headers: { 'Content-Type': 'application/json' } });
      }
      if (method === 'POST') {
        const { name, email, phone, company, balance } = await req.json();
        const inserted = await sql`
          INSERT INTO clients (name, email, phone, company, balance)
          VALUES (${name}, ${email || null}, ${phone || null}, ${company || null}, ${parseFloat(balance || 0)})
          RETURNING *;
        `;
        return new Response(JSON.stringify(inserted[0]), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 6. Categories (/api/categories)
    if (path === 'categories' || path === 'categories/') {
      const categories = await sql`SELECT * FROM categories ORDER BY name ASC;`;
      return new Response(JSON.stringify(categories), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found", path }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
