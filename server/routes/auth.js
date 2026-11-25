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
  const firstName = req.body?.firstName?.trim();
  const lastName = req.body?.lastName?.trim();
  const providedDisplayName = req.body?.displayName?.trim();

  let displayName = providedDisplayName || req.user.name || email?.split('@')[0] || '';
  if (firstName || lastName) {
    displayName = `${firstName || ''} ${lastName || ''}`.trim();
  }

  try {
    let userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);

    if (userRecord) {
      if (providedDisplayName || firstName || lastName) {
        db.prepare(
          `UPDATE users SET 
             email = ?, 
             display_name = ?, 
             first_name = coalesce(?, first_name), 
             last_name = coalesce(?, last_name), 
             profile_completed = 1 
           WHERE id = ?`
        ).run(email, displayName, firstName || null, lastName || null, uid);
      } else {
        db.prepare(
          `UPDATE users SET email = ?, photo_url = coalesce(nullif(?, ''), photo_url) WHERE id = ?`
        ).run(email, picture, uid);
      }
      userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    } else {
      const isCompleted = (providedDisplayName || firstName || lastName) ? 1 : 0;
      db.prepare(
        `INSERT INTO users (id, email, display_name, first_name, last_name, photo_url, profile_completed) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(uid, email, displayName, firstName || null, lastName || null, picture || null, isCompleted);
      userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    }

    res.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.display_name,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        picture: userRecord.photo_url,
        profileCompleted: Boolean(userRecord.profile_completed),
      },
      message: 'Sesión verificada',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar nombre y apellidos del perfil
router.put('/profile', authenticate, (req, res) => {
  const { uid } = req.user;
  const { firstName, lastName, displayName } = req.body;

  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  let fullName = (displayName || '').trim();

  if (fName || lName) {
    fullName = `${fName} ${lName}`.trim();
  }

  if (!fullName) {
    return res.status(400).json({ error: 'Debes indicar al menos un nombre' });
  }

  try {
    db.prepare(`
      UPDATE users 
      SET display_name = ?, 
          first_name = ?, 
          last_name = ?, 
          profile_completed = 1 
      WHERE id = ?
    `).run(fullName, fName || null, lName || null, uid);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);

    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.display_name,
        firstName: updated.first_name,
        lastName: updated.last_name,
        picture: updated.photo_url,
        profileCompleted: true,
      },
      message: 'Perfil actualizado con éxito',
    });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'No se pudo actualizar el perfil' });
  }
});

module.exports = router;
