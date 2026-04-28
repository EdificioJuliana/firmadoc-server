const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
 
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
 
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'edificiojulianavictorianorte@gmail.com';
const ADMIN_NAME  = process.env.ADMIN_NAME  || 'Edificio Juliana P.H.';
const BREVO_USER  = process.env.BREVO_USER  || '';  // tu correo de login en Brevo
const BREVO_PASS  = process.env.BREVO_PASS  || '';  // clave SMTP de Brevo
 
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: BREVO_USER, pass: BREVO_PASS },
});
 
const send = (to, subject, text) =>
  transporter.sendMail({
    from: `"${ADMIN_NAME}" <${BREVO_USER}>`,
    to, subject, text,
  });
 
app.post('/send-email', async (req, res) => {
  const { toEmail, toName, signerName, signerId, docName, signedAt, message } = req.body;
  if (!toEmail || !signerName) return res.status(400).json({ error: 'Faltan campos' });
 
  const subject = `Firma de documento — ${docName}`;
  const body = (name, msg) =>
    `Hola ${name},\n\n${msg}\n\nFirmante: ${signerName}\nIdentificación: ${signerId}\nDocumento: ${docName}\nFecha: ${signedAt}\n\n— FirmaDoc · Edificio Juliana Victoria Norte`;
 
  try {
    await send(toEmail, subject, body(toName, message));
    if (toEmail !== ADMIN_EMAIL) {
      await send(ADMIN_EMAIL, subject,
        body(ADMIN_NAME, `${signerName} (ID: ${signerId}, correo: ${toEmail}) firmó "${docName}" el ${signedAt}.`)
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Mail error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
 
app.get('/', (_, res) => res.json({ status: 'FirmaDoc mail server OK' }));
app.listen(process.env.PORT || 3000, () => console.log('Server running'));
 




