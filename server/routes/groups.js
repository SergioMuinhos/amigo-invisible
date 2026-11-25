const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendAssignmentEmail } = require('../services/mailer');

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Listar grupos del usuario autenticado
router.get('/', authenticate, (req, res) => {
  try {
    const groups = db
      .prepare(`
        SELECT g.id, g.name, g.code, g.assigned, g.created_at, g.creator_id,
               u.display_name AS creator_name,
               (SELECT COUNT(*) FROM members WHERE group_id = g.id) AS member_count
        FROM groups g
        JOIN members m ON m.group_id = g.id
        JOIN users u ON u.id = g.creator_id
        WHERE m.user_id = ?
        ORDER BY g.created_at DESC
      `)
      .all(req.user.id || req.user.uid);

    res.json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

// Crear un nuevo grupo
router.post('/', authenticate, (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Nombre del grupo requerido' });
  }

  const id = uuidv4();
  const code = generateCode();

  try {
    const insert = db.prepare(
      `INSERT INTO groups (id, name, code, creator_id) VALUES (?, ?, ?, ?)`
    );
    insert.run(id, name.trim(), code, req.user.id || req.user.uid);

    // El creador se une automáticamente como miembro
    db.prepare(
      `INSERT INTO members (id, group_id, user_id) VALUES (?, ?, ?)`
    ).run(uuidv4(), id, req.user.id || req.user.uid);

    res.status(201).json({
      group: { id, name: name.trim(), code, assigned: 0 },
      message: 'Grupo creado',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// Unirse a un grupo por código
router.post('/join', authenticate, (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Código de grupo requerido' });
  }

  try {
    const group = db.prepare('SELECT * FROM groups WHERE code = ?').get(code);

    if (!group) {
      return res.status(404).json({ error: 'Código de grupo inválido' });
    }

    const alreadyMember = db
      .prepare('SELECT * FROM members WHERE group_id = ? AND user_id = ?')
      .get(group.id, req.user.id || req.user.uid);

    if (alreadyMember) {
      return res.status(400).json({ error: 'Ya eres miembro de este grupo' });
    }

    db.prepare(
      `INSERT INTO members (id, group_id, user_id) VALUES (?, ?, ?)`
    ).run(uuidv4(), group.id, req.user.id || req.user.uid);

    res.json({
      group: { id: group.id, name: group.name, code: group.code },
      message: 'Te has unido al grupo',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
});

// Detalle de un grupo con sus miembros
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el usuario sea miembro
    const member = db
      .prepare('SELECT * FROM members WHERE group_id = ? AND user_id = ?')
      .get(id, req.user.id || req.user.uid);

    if (!member) {
      return res.status(403).json({ error: 'No eres miembro de este grupo' });
    }

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);

    const members = db
      .prepare(`
        SELECT m.user_id, u.display_name, u.email, u.photo_url, m.assigned_to,
               au.display_name AS assigned_name
        FROM members m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN users au ON au.id = m.assigned_to
        WHERE m.group_id = ?
        ORDER BY m.joined_at
      `)
      .all(id);

    res.json({
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        assigned: !!group.assigned,
        creator_id: group.creator_id,
        is_creator: group.creator_id === (req.user.id || req.user.uid),
      },
      members: members.map((m) => ({
        id: m.user_id,
        name: m.display_name,
        email: m.email,
        photo: m.photo_url,
        assignedTo: m.assigned_to ? { id: m.assigned_to, name: m.assigned_name } : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el grupo' });
  }
});

// Añadir un participante manualmente al grupo (solo el creador)
router.post('/:id/members', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre y apellido son obligatorios' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (group.creator_id !== (req.user.id || req.user.uid)) {
      return res.status(403).json({ error: 'Solo el creador puede añadir participantes directamente' });
    }
    if (group.assigned) {
      return res.status(400).json({ error: 'No se pueden añadir participantes después de haber realizado el sorteo' });
    }

    // Comprobar si ya existe un miembro con este email en el grupo
    const existingMember = db
      .prepare(`
        SELECT m.id FROM members m
        JOIN users u ON u.id = m.user_id
        WHERE m.group_id = ? AND LOWER(u.email) = ?
      `)
      .get(id, cleanEmail);

    if (existingMember) {
      return res.status(400).json({ error: 'Este correo ya forma parte del grupo' });
    }

    // Buscar si el usuario ya existe en la base de datos o crearlo
    let user = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    let userId = user ? user.id : null;

    if (!userId) {
      userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, display_name, photo_url)
        VALUES (?, ?, ?, '')
      `).run(userId, cleanEmail, cleanName);
    } else {
      // Actualizar nombre si no tenía
      db.prepare(`
        UPDATE users SET display_name = coalesce(nullif(display_name, ''), ?) WHERE id = ?
      `).run(cleanName, userId);
    }

    // Añadir al grupo
    db.prepare(`
      INSERT INTO members (id, group_id, user_id)
      VALUES (?, ?, ?)
    `).run(uuidv4(), id, userId);

    res.status(201).json({
      message: 'Participante añadido correctamente',
      member: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al añadir participante' });
  }
});

// Asignar amigo invisible aleatoriamente dentro del grupo y enviar emails
router.post('/:id/assign', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    // Solo el creador puede asignar
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (group.creator_id !== (req.user.id || req.user.uid)) {
      return res.status(403).json({ error: 'Solo el creador puede hacer la asignación' });
    }

    const members = db
      .prepare(`
        SELECT m.user_id, u.display_name, u.email
        FROM members m
        JOIN users u ON u.id = m.user_id
        WHERE m.group_id = ?
      `)
      .all(id);

    if (members.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 miembros para realizar el sorteo' });
    }

    const n = members.length;
    // Fisher-Yates shuffle
    const shuffled = [...members];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Asignación circular perfecta (shuffled[i] regala a shuffled[(i+1)%n])
    // Cero auto-asignaciones garantizado para cualquier n >= 2
    const assignments = [];
    for (let i = 0; i < n; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % n];
      assignments.push({ giver, receiver });
    }

    const update = db.prepare(
      `UPDATE members SET assigned_to = ? WHERE group_id = ? AND user_id = ?`
    );
    const tx = db.transaction(() => {
      for (const { giver, receiver } of assignments) {
        update.run(receiver.user_id, id, giver.user_id);
      }
      db.prepare(`UPDATE groups SET assigned = 1 WHERE id = ?`).run(id);
    });
    tx();

    // Enviar correos discretos y bonitos a todos los participantes
    for (const { giver, receiver } of assignments) {
      if (giver.email) {
        sendAssignmentEmail({
          giverEmail: giver.email,
          giverName: giver.display_name,
          receiverName: receiver.display_name,
          receiverEmail: receiver.email,
          groupName: group.name,
          groupId: group.id,
        }).catch((err) => console.error(`Error enviando email a ${giver.email}:`, err));
      }
    }

    res.json({
      message: '¡Sorteo realizado con éxito! Se han enviado los correos a los participantes.',
      assigned: true,
      participantCount: n,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al realizar el sorteo' });
  }
});

// Obtener mi asignación en un grupo
router.get('/:id/my-assignment', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const member = db
      .prepare(`
        SELECT m.assigned_to, u.display_name AS assigned_name, u.email AS assigned_email
        FROM members m
        JOIN users u ON u.id = m.assigned_to
        WHERE m.group_id = ? AND m.user_id = ?
      `)
      .get(id, req.user.id || req.user.uid);

    if (!member || !member.assigned_to) {
      return res.json({ assigned: false });
    }

    res.json({
      assigned: true,
      assignedTo: {
        id: member.assigned_to,
        name: member.assigned_name,
        email: member.assigned_email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tu asignación' });
  }
});

module.exports = router;
