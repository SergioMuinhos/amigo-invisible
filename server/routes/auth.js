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
      .prepare('SELECT id, email, is_registered FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email.trim());

    // Si no existe, o si solo fue añadido como participante invitado previo (is_registered === 0),
    // no se considera registrado para permitirle registrarse sin bloqueos.
    const isRegistered = Boolean(existing && existing.is_registered === 1);

    res.json({ exists: isRegistered });
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
             profile_completed = 1,
             is_registered = 1 
           WHERE id = ?`
        ).run(email, displayName, firstName || null, lastName || null, uid);
      } else {
        db.prepare(
          `UPDATE users SET email = ?, photo_url = coalesce(nullif(?, ''), photo_url), is_registered = 1 WHERE id = ?`
        ).run(email, picture, uid);
      }
      userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    } else {
      // Si no existe por UID, comprobar si existía un registro previo por email (creado al invitarlo a un grupo)
      const existingByEmail = db
        .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
        .get(email);

      if (existingByEmail) {
        const oldId = existingByEmail.id;
        db.pragma('foreign_keys = OFF');
        const migrateTx = db.transaction(() => {
          // Actualizar claves foráneas en members y groups al nuevo UID de Firebase
          db.prepare('UPDATE members SET user_id = ? WHERE user_id = ?').run(uid, oldId);
          db.prepare('UPDATE members SET assigned_to = ? WHERE assigned_to = ?').run(uid, oldId);
          db.prepare('UPDATE groups SET creator_id = ? WHERE creator_id = ?').run(uid, oldId);

          const isCompleted =
            providedDisplayName || firstName || lastName
              ? 1
              : existingByEmail.profile_completed || 0;

          // Actualizar el usuario al nuevo UID de Firebase y marcar como registrado
          db.prepare(
            `UPDATE users SET 
               id = ?, 
               email = ?, 
               display_name = coalesce(nullif(?, ''), display_name), 
               first_name = coalesce(?, first_name), 
               last_name = coalesce(?, last_name), 
               photo_url = coalesce(nullif(?, ''), photo_url), 
               is_registered = 1, 
               profile_completed = ? 
             WHERE id = ?`
          ).run(
            uid,
            email,
            displayName,
            firstName || null,
            lastName || null,
            picture || null,
            isCompleted,
            oldId
          );
        });
        migrateTx();
        db.pragma('foreign_keys = ON');

        userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
      } else {
        // Usuario totalmente nuevo
        const isCompleted = providedDisplayName || firstName || lastName ? 1 : 0;
        db.prepare(
          `INSERT INTO users (id, email, display_name, first_name, last_name, photo_url, profile_completed, is_registered) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
        ).run(uid, email, displayName, firstName || null, lastName || null, picture || null, isCompleted);
        userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
      }
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
          profile_completed = 1,
          is_registered = 1 
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
