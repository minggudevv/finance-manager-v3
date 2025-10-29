export async function sendWhatsAppMessage(phone: string, message: string) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.warn('FONNTE_TOKEN is not set');
    return { ok: false, error: 'Missing token' };
  }
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': token,
      },
      body: new URLSearchParams({
        target: phone,
        message,
      }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.detail || 'Failed to send' };
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}
