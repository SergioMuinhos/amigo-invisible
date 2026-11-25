const admin = require('firebase-admin');
const db = require('../db');

// Inicializar Firebase Admin si existe la configuración
let adminApp = null;
try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
} catch (err) {
  console.warn('Firebase Admin no configurado:', err.message);
}

/**
 * Middleware que verifica el ID token de Firebase enviado en
 * Authorization: Bearer <token>
 * Adjunta req.user con { uid, email, name, picture }
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    let uid, email, name, picture;

    // Si no hay Admin SDK configurado, aceptamos el token y decodificamos el payload sin firmar
    // solo para desarrollo. En producción configurar FIREBASE_* en el entorno.
    if (!adminApp) {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      uid = payload.user_id || payload.sub;
      email = payload.email || '';
      name = payload.name || '';
      picture = payload.picture || '';
    } else {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email || '';
      name = decodedToken.name || '';
      picture = decodedToken.picture || '';
    }

    req.user = {
      id: uid,
      uid,
      email,
      name,
      picture,
    };

    // Asegurar que el usuario existe en la tabla SQLite para cumplir con las claves foráneas
    try {
      db.prepare(`
        INSERT INTO users (id, email, display_name, photo_url)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          email = excluded.email,
          display_name = coalesce(nullif(excluded.display_name, ''), users.display_name),
          photo_url = coalesce(nullif(excluded.photo_url, ''), users.photo_url)
      `).run(uid, email, name || email.split('@')[0] || 'Usuario', picture);
    } catch (syncErr) {
      console.warn('Error sincronizando usuario en DB:', syncErr.message);
    }

    next();
  } catch (err) {
    console.error('Error verificando token:', err.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { authenticate, adminApp };
