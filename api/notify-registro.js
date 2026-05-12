export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nombre, email, telefono } = req.body;

  if (!nombre || !email) return res.status(400).json({ error: "Faltan datos" });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #0a0f0d; padding: 24px; border-radius: 12px; border: 1px solid #1e3028;">
        <h2 style="color: #00c46a; font-size: 22px; margin: 0 0 16px 0;">⚽ PRODE MUNDIAL 2026</h2>
        <p style="color: #e8f5ee; margin: 0 0 16px 0;">Hay un nuevo usuario pendiente de aprobación:</p>
        <div style="background: #111a15; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #7a9e8a; font-size: 12px; margin: 0 0 4px 0;">NOMBRE</p>
          <p style="color: #e8f5ee; font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">${nombre}</p>
          <p style="color: #7a9e8a; font-size: 12px; margin: 0 0 4px 0;">EMAIL</p>
          <p style="color: #e8f5ee; font-size: 15px; margin: 0 0 12px 0;">${email}</p>
          ${telefono ? `<p style="color: #7a9e8a; font-size: 12px; margin: 0 0 4px 0;">WHATSAPP</p><p style="color: #e8f5ee; font-size: 15px; margin: 0;">${telefono}</p>` : ""}
        </div>
        <a href="https://prode-mundial-2026-sage.vercel.app/" style="display: inline-block; background: #00c46a; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 15px;">Ir al panel admin →</a>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Prode Mundial <onboarding@resend.dev>",
        to: ["puglisipablo@hotmail.com"],
        subject: `⚽ Nuevo registro: ${nombre}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
