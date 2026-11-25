const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Registrar o actualizar usuario tras iniciar sesión con Firebase
router.post('/verify', authenticate, (req, res) => {
  const { uid, email, name, picture } = req.user;

  if (!uid || !email) {
    return res.status(400).json({ error: 'Datos de usuario incompletos' });
  }

  try {
    const existing = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(uid);

    if (existing) {
      db.prepare(
        `UPDATE users SET email = ?, display_name = ?, photo_url = ? WHERE id = ?`
      ).run(email, name, picture, uid);
      return res.json({
        user: { id: existing.id, email, name, picture },
        message: 'Sesión iniciada',
      });
    }

    const insert = db.prepare(
      `INSERT INTO users (id, email, display_name, photo_url) VALUES (?, ?, ?, ?)`
    );
    insert.run(uid, email, name, picture);

    res.status(201).json({
      user: { id: uid, email, name, picture },
      message: 'Usuario registrado',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
