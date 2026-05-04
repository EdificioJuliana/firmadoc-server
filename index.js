const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const ADMIN_EMAIL   = process.env.ADMIN_EMAIL   || 'edificiojulianavictorianorte@gmail.com';
const ADMIN_NAME    = process.env.ADMIN_NAME    || 'Edificio Juliana P.H.';
const BREVO_USER    = process.env.BREVO_USER    || '';
const BREVO_PASS    = process.env.BREVO_PASS    || '';
const ADMIN_PIN     = process.env.ADMIN_PIN     || 'Juliana2026';

// Configuración en memoria (persiste mientras el servidor esté activo)
let config = {
  adminEmail: ADMIN_EMAIL,
  adminName:  ADMIN_NAME,
  serverUrl:  'https://firmadoc-server.onrender.com',
};

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: BREVO_USER, pass: BREVO_PASS },
});

const send = (to, subject, text) =>
  transporter.sendMail({
    from: `"${config.adminName}" <${BREVO_USER}>`,
    to, subject, text,
  });

// ── GET config (pública — cualquier dispositivo la carga al abrir la app)
app.get('/config', (req, res) => {
  res.json({ adminEmail: config.adminEmail, adminName: config.adminName, serverUrl: config.serverUrl });
});

// ── POST config (protegida con PIN)
app.post('/config', (req, res) => {
  const { pin, adminEmail, adminName } = req.body;
  if (pin !== ADMIN_PIN) return res.status(403).json({ error: 'PIN incorrecto' });
  if (!adminEmail || !adminName) return res.status(400).json({ error: 'Faltan campos' });
  config.adminEmail = adminEmail.trim();
  config.adminName  = adminName.trim();
  console.log('Config actualizada:', config.adminEmail, config.adminName);
  res.json({ ok: true, adminEmail: config.adminEmail, adminName: config.adminName });
});

// ── POST send-email
app.post('/send-email', async (req, res) => {
  const { toEmail, toName, signerName, signerId, docName, signedAt, message } = req.body;
  if (!toEmail || !signerName) return res.status(400).json({ error: 'Faltan campos' });

  const subject = `Firma de documento — ${docName}`;
  const body = (name, msg) =>
    `Hola ${name},\n\n${msg}\n\nFirmante: ${signerName}\nIdentificación: ${signerId}\nDocumento: ${docName}\nFecha: ${signedAt}\n\n— FirmaDoc · Edificio Juliana Victoria Norte`;

  try {
    await send(toEmail, subject, body(toName, message));
    if (toEmail !== config.adminEmail) {
      await send(config.adminEmail, subject,
        body(config.adminName, `${signerName} (ID: ${signerId}, correo: ${toEmail}) firmó "${docName}" el ${signedAt}.`)
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
