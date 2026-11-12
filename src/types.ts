export interface Order {
  id: number;
  order_id: string;
  product_name: string;
  product_price: number;
  recipient_name: string;
  recipient_mobile: string;
  street_address: string;
  complex: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  delivery_type: string;
  status: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  raw_utms?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Lead {
  id?: number;
  recipient_name: string;
  recipient_mobile: string;
  street_address: string;
  complex: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  step: string;
  raw_utms?: string;
  ip_address?: string;
  created_at?: string;
}

export interface AnalyticsStats {
  totalViews: number;
  totalCheckouts: number;
  totalOrders: number;
  totalRevenue: number;
  totalLeads: number;
  conversionRate: string;
  eventsBreakdown: Record<string, number>;
  recentOrders: Order[];
}
