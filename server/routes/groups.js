const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

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
      .all(req.user.uid);

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

// Asignar amigo invisible aleatoriamente dentro del grupo
router.post('/:id/assign', authenticate, (req, res) => {
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
      .prepare('SELECT user_id FROM members WHERE group_id = ?')
      .all(id);

    if (members.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 miembros' });
    }

    const userIds = members.map((m) => m.user_id);
    const shuffled = [...userIds].sort(() => 0.5 - Math.random());

    // Evitar auto-asignación: si alguien le toca a sí mismo, rotar una posición
    let hasSelf = shuffled.some((uid, i) => uid === userIds[i]);
    if (hasSelf) {
      // Desplazar una posición
      const first = shuffled.shift();
      shuffled.push(first);
    }

    // Volver a verificar después del desplazamiento (grupos de 2 pueden quedar igual)
    const stillSelf = shuffled.some((uid, i) => uid === userIds[i]);
    if (stillSelf && userIds.length === 2) {
      return res
        .status(400)
        .json({ error: 'No se puede asignar con solo 2 miembros sin repetirse' });
    }

    const update = db.prepare(
      `UPDATE members SET assigned_to = ? WHERE group_id = ? AND user_id = ?`
    );
    const tx = db.transaction(() => {
      for (let i = 0; i < userIds.length; i++) {
        update.run(shuffled[i], id, userIds[i]);
      }
      db.prepare(`UPDATE groups SET assigned = 1 WHERE id = ?`).run(id);
    });
    tx();

    res.json({ message: 'Asignación completada', assigned: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al asignar' });
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
