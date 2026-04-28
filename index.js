const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const BREVO_KEY = process.env.BREVO_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'edificiojulianavictorianorte@gmail.com';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Edificio Juliana P.H.';

app.post('/send-email', async (req, res) => {
  const { toEmail, toName, signerName, signerId, docName, signedAt, message } = req.body;
  if (!toEmail || !signerName) return res.status(400).json({ error: 'Faltan campos' });

  const send = async (to, name, msg) => {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: ADMIN_NAME, email: ADMIN_EMAIL },
        to: [{ email: to, name }],
        subject: `Firma de documento — ${docName}`,
        textContent: `Hola ${name},\n\n${msg}\n\nFirmante: ${signerName}\nIdentificación: ${signerId}\nDocumento: ${docName}\nFecha: ${signedAt}\n\n— FirmaDoc · Edificio Juliana Victoria Norte`,
      }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
  };

  try {
    await send(toEmail, toName, message);
    if (toEmail !== ADMIN_EMAIL) {
      await send(ADMIN_EMAIL, ADMIN_NAME,
        `${signerName} (ID: ${signerId}, correo: ${toEmail}) firmó "${docName}" el ${signedAt}.`
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Brevo error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (_, res) => res.json({ status: 'FirmaDoc mail server OK' }));
app.listen(process.env.PORT || 3000, () => console.log('Server running'));
