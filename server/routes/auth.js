const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Comprobar si un email ya está registrado
router.post('/check-email', (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    const existing = db
      .prepare('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email.trim());

    res.json({ exists: Boolean(existing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al comprobar correo' });
  }
});

// Registrar o actualizar usuario tras iniciar sesión con Firebase
router.post('/verify', authenticate, (req, res) => {
  const { uid, email, picture } = req.user;
  // Si el cliente envía displayName (Nombre y Apellido del registro), lo usamos
  const displayName = req.body?.displayName?.trim() || req.user.name || email?.split('@')[0] || '';

  if (!uid || !email) {
    return res.status(400).json({ error: 'Datos de usuario incompletos' });
  }

  try {
    const existing = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(uid);

    if (existing) {
      db.prepare(
        `UPDATE users SET email = ?, display_name = coalesce(nullif(?, ''), display_name), photo_url = coalesce(nullif(?, ''), photo_url) WHERE id = ?`
      ).run(email, displayName, picture, uid);
      return res.json({
        user: { id: existing.id, email, name: displayName || existing.display_name, picture },
        message: 'Sesión iniciada',
      });
    }

    const insert = db.prepare(
      `INSERT INTO users (id, email, display_name, photo_url) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         display_name = coalesce(nullif(excluded.display_name, ''), users.display_name),
         photo_url = coalesce(nullif(excluded.photo_url, ''), users.photo_url)`
    );
    insert.run(uid, email, displayName, picture);

    res.status(201).json({
      user: { id: uid, email, name: displayName, picture },
      message: 'Usuario registrado',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
