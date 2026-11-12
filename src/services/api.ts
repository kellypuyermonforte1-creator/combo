import { Order, Lead, AnalyticsStats } from '../types.ts';

// Extract current UTM parameters from URL query string
export function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    utms[key] = value;
  }
  return utms;
}

// Track an event asynchronously without slowing down page navigation
export function trackEvent(eventName: string, page: string = window.location.pathname): void {
  try {
    const rawUtms = window.location.search;
    const referrer = document.referrer || '';
    
    // Facebook Pixel track if available
    if (typeof (window as any).fbq === 'function') {
      try {
        (window as any).fbq('track', eventName);
      } catch (_) {}
    }

    // SendBeacon preferred for non-blocking unload safety
    const payload = JSON.stringify({
      event_name: eventName,
      page,
      referrer,
      raw_utms: rawUtms
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/events', blob);
    } else {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch (_) {}
}

// Save lead data as user fills out checkout form
export async function saveLead(leadData: Lead): Promise<boolean> {
  try {
    const rawUtms = window.location.search;
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...leadData,
        raw_utms: rawUtms
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save lead:', err);
    return false;
  }
}

// Save completed order to SQLite database
export async function saveOrder(orderData: Partial<Order>): Promise<{ ok: boolean; order_id?: string }> {
  try {
    const utms = getUtmParams();
    const rawUtms = window.location.search;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        utm_source: utms['utm_source'] || '',
        utm_medium: utms['utm_medium'] || '',
        utm_campaign: utms['utm_campaign'] || '',
        utm_content: utms['utm_content'] || '',
        utm_term: utms['utm_term'] || '',
        raw_utms: rawUtms
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Failed to save order:', err);
    return { ok: false };
  }
}

// Fetch all orders for admin dashboard
export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders');
    const data = await res.json();
    return data.orders || [];
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    return [];
  }
}

// Update order status
export async function updateOrderStatus(id: number, status: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update status:', err);
    return false;
  }
}

// Fetch dashboard analytics
export async function fetchStats(): Promise<AnalyticsStats | null> {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    return data.stats || null;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    return null;
  }
}
