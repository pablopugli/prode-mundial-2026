export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nombre, email, partidos } = req.body;
  if (!nombre || !email || !partidos?.length) return res.status(400).json({ error: "Faltan datos" });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const listaPartidos = partidos.map(p =>
    `<div style="padding: 10px 14px; background: #1a2820; border-radius: 8px; margin-bottom: 8px;">
      <div style="color: #7a9e8a; font-size: 12px;">${p.fecha} · ${p.hora}${p.canal ? ` · ${p.canal}` : ""}</div>
      <div style="color: #e8f5ee; font-size: 15px; font-weight: bold; margin-top: 4px;">${p.local} vs ${p.visitante}</div>
    </div>`
  ).join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #0a0f0d; padding: 24px; border-radius: 12px; border: 1px solid #ff3b3b;">
        <h2 style="color: #ff3b3b; font-size: 22px; margin: 0 0 8px 0;">⚠️ ¡Te falta cargar picks!</h2>
        <p style="color: #e8f5ee; margin: 0 0 16px 0;">Hola <strong>${nombre}</strong>, estos partidos arrancan pronto y todavía no cargaste tu pronóstico:</p>
        ${listaPartidos}
        <p style="color: #7a9e8a; font-size: 12px; margin: 16px 0 20px 0;">Los pronósticos se cierran 15 minutos antes de cada partido.</p>
        <a href="https://prode-mundial-2026-sage.vercel.app/" style="display: inline-block; background: #00c46a; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 15px;">Cargar pronósticos →</a>
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
        to: [email],
        subject: `⚠️ Tenés ${partidos.length} partido${partidos.length > 1 ? "s" : ""} sin pronosticar`,
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
