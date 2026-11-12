import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app_database.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency and sub-millisecond writes
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB cache

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    product_price REAL NOT NULL,
    recipient_name TEXT,
    recipient_mobile TEXT,
    street_address TEXT,
    complex TEXT,
    suburb TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    delivery_type TEXT DEFAULT 'Residential',
    status TEXT DEFAULT 'initiated_payment',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    raw_utms TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_name TEXT,
    recipient_mobile TEXT,
    street_address TEXT,
    complex TEXT,
    suburb TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    step TEXT NOT NULL,
    raw_utms TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    page TEXT NOT NULL,
    referrer TEXT,
    raw_utms TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
  CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
`);

// Prepared statements for zero-overhead execution
export const insertOrderStmt = db.prepare(`
  INSERT INTO orders (
    order_id, product_name, product_price, recipient_name, recipient_mobile,
    street_address, complex, suburb, city, province, postal_code, delivery_type,
    status, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    raw_utms, ip_address, user_agent, created_at
  ) VALUES (
    @order_id, @product_name, @product_price, @recipient_name, @recipient_mobile,
    @street_address, @complex, @suburb, @city, @province, @postal_code, @delivery_type,
    @status, @utm_source, @utm_medium, @utm_campaign, @utm_content, @utm_term,
    @raw_utms, @ip_address, @user_agent, @created_at
  )
`);

export const insertLeadStmt = db.prepare(`
  INSERT INTO leads (
    recipient_name, recipient_mobile, street_address, complex,
    suburb, city, province, postal_code, step, raw_utms, ip_address, created_at
  ) VALUES (
    @recipient_name, @recipient_mobile, @street_address, @complex,
    @suburb, @city, @province, @postal_code, @step, @raw_utms, @ip_address, @created_at
  )
`);

export const insertEventStmt = db.prepare(`
  INSERT INTO events (
    event_name, page, referrer, raw_utms, ip_address, user_agent, created_at
  ) VALUES (
    @event_name, @page, @referrer, @raw_utms, @ip_address, @user_agent, @created_at
  )
`);

export const getOrdersStmt = db.prepare(`
  SELECT * FROM orders ORDER BY id DESC LIMIT 200
`);

export const getStatsStmt = {
  totalOrders: db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(product_price), 0) as revenue FROM orders'),
  totalLeads: db.prepare('SELECT COUNT(*) as count FROM leads'),
  totalEvents: db.prepare('SELECT event_name, COUNT(*) as count FROM events GROUP BY event_name'),
  recentOrders: db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 10'),
};
