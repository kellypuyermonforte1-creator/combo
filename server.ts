import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  insertOrderStmt,
  insertLeadStmt,
  insertEventStmt,
  getOrdersStmt,
  getStatsStmt,
  db
} from './src/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsing with ultra-fast limits
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to extract client IP and UTM parameters
function getClientInfo(req: Request) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return { ip, userAgent };
}

// ================= API ROUTES =================

// 1. Asynchronous Event Tracking (Pixel & Funnel Analytics)
app.post('/api/events', (req: Request, res: Response) => {
  try {
    const { event_name, page, referrer, raw_utms } = req.body;
    const { ip, userAgent } = getClientInfo(req);
    
    insertEventStmt.run({
      event_name: event_name || 'unknown',
      page: page || '/',
      referrer: referrer || '',
      raw_utms: raw_utms || '',
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    });

    res.status(200).json({ ok: true });
  } catch (err: any) {
    // Non-blocking response
    res.status(200).json({ ok: false, error: err.message });
  }
});

// 2. Checkout Lead Capture (auto-saved before payment redirection)
app.post('/api/leads', (req: Request, res: Response) => {
  try {
    const {
      recipient_name,
      recipient_mobile,
      street_address,
      complex,
      suburb,
      city,
      province,
      postal_code,
      step,
      raw_utms
    } = req.body;
    const { ip } = getClientInfo(req);

    insertLeadStmt.run({
      recipient_name: recipient_name || '',
      recipient_mobile: recipient_mobile || '',
      street_address: street_address || '',
      complex: complex || '',
      suburb: suburb || '',
      city: city || '',
      province: province || '',
      postal_code: postal_code || '',
      step: step || 'started_form',
      raw_utms: raw_utms || '',
      ip_address: ip,
      created_at: new Date().toISOString()
    });

    res.status(200).json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. Complete Order Creation & Storage
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const {
      product_name,
      product_price,
      recipient_name,
      recipient_mobile,
      street_address,
      complex,
      suburb,
      city,
      province,
      postal_code,
      delivery_type,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      raw_utms
    } = req.body;
    const { ip, userAgent } = getClientInfo(req);

    const orderId = 'TK-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

    insertOrderStmt.run({
      order_id: orderId,
      product_name: product_name || 'Defy 30L Microwave + Russell Hobbs 6.5L Air Fryer + Mellerware Glass Kettle',
      product_price: Number(product_price) || 599,
      recipient_name: recipient_name || '',
      recipient_mobile: recipient_mobile || '',
      street_address: street_address || '',
      complex: complex || '',
      suburb: suburb || '',
      city: city || '',
      province: province || '',
      postal_code: postal_code || '',
      delivery_type: delivery_type || 'Residential',
      status: 'initiated_payment',
      utm_source: utm_source || '',
      utm_medium: utm_medium || '',
      utm_campaign: utm_campaign || '',
      utm_content: utm_content || '',
      utm_term: utm_term || '',
      raw_utms: raw_utms || '',
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    });

    res.status(200).json({
      ok: true,
      order_id: orderId,
      message: 'Order saved to database'
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. Get Orders List (for admin / dashboard)
app.get('/api/orders', (_req: Request, res: Response) => {
  try {
    const orders = getOrdersStmt.all();
    res.json({ ok: true, orders });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. Update Order Status
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. Real-time Dashboard Analytics Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const ordersSummary = getStatsStmt.totalOrders.get() as { count: number; revenue: number };
    const leadsSummary = getStatsStmt.totalLeads.get() as { count: number };
    const eventsRows = getStatsStmt.totalEvents.all() as Array<{ event_name: string; count: number }>;
    const recentOrders = getStatsStmt.recentOrders.all();

    const eventsMap: Record<string, number> = {};
    for (const r of eventsRows) {
      eventsMap[r.event_name] = r.count;
    }

    const views = eventsMap['PageView'] || 0;
    const checkouts = eventsMap['InitiateCheckout'] || 0;
    const conversions = ordersSummary.count;
    const conversionRate = views > 0 ? ((conversions / views) * 100).toFixed(2) : '0.00';

    res.json({
      ok: true,
      stats: {
        totalViews: views,
        totalCheckouts: checkouts,
        totalOrders: ordersSummary.count,
        totalRevenue: ordersSummary.revenue,
        totalLeads: leadsSummary.count,
        conversionRate: `${conversionRate}%`,
        eventsBreakdown: eventsMap,
        recentOrders
      }
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 7. CSV Export for Orders
app.get('/api/export-orders', (_req: Request, res: Response) => {
  try {
    const orders = getOrdersStmt.all() as any[];
    const headers = [
      'Order ID', 'Date', 'Customer Name', 'Mobile', 'Street Address',
      'Complex', 'Suburb', 'City', 'Province', 'Postal Code',
      'Product', 'Amount', 'Status', 'UTM Source', 'UTM Campaign'
    ];
    
    const rows = orders.map(o => [
      `"${o.order_id}"`,
      `"${o.created_at}"`,
      `"${(o.recipient_name || '').replace(/"/g, '""')}"`,
      `"${(o.recipient_mobile || '').replace(/"/g, '""')}"`,
      `"${(o.street_address || '').replace(/"/g, '""')}"`,
      `"${(o.complex || '').replace(/"/g, '""')}"`,
      `"${(o.suburb || '').replace(/"/g, '""')}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.province || '').replace(/"/g, '""')}"`,
      `"${(o.postal_code || '').replace(/"/g, '""')}"`,
      `"${(o.product_name || '').replace(/"/g, '""')}"`,
      `"${o.product_price}"`,
      `"${o.status}"`,
      `"${(o.utm_source || '').replace(/"/g, '""')}"`,
      `"${(o.utm_campaign || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="takealot_orders.csv"');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).send('Error exporting CSV: ' + err.message);
  }
});

// ================= STATIC / VITE INTEGRATION =================
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
