const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const {
  sendAssignmentEmail,
  sendRejectionNoticeToCreator,
  sendGroupInvitationEmail,
  isEmailConfigured,
} = require('../services/mailer');

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Listar grupos del usuario autenticado
router.get('/', authenticate, (req, res) => {
  try {
    const groups = db
      .prepare(`
        SELECT g.id, g.name, g.code, g.assigned, g.created_at, g.creator_id, g.emails_sent,
               u.display_name AS creator_name,
               (SELECT COUNT(*) FROM members WHERE group_id = g.id) AS member_count,
               (SELECT COUNT(*) FROM members WHERE group_id = g.id AND validation_status = 'rejected') AS rejected_count,
               (SELECT COUNT(*) FROM members WHERE group_id = g.id AND validation_status = 'approved') AS approved_count
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
      return res.json({
        group: { id: group.id, name: group.name, code: group.code },
        message: 'Ya eres miembro de este grupo',
      });
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

// Cambiar nombre del grupo (solo el creador)
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del grupo no puede estar vacío' });
  }

  const cleanName = name.trim();

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const currentUserId = req.user.id || req.user.uid;
    if (group.creator_id !== currentUserId) {
      return res.status(403).json({ error: 'Solo el creador puede cambiar el nombre del grupo' });
    }

    db.prepare('UPDATE groups SET name = ? WHERE id = ?').run(cleanName, id);

    res.json({
      message: 'Nombre del grupo actualizado correctamente',
      group: {
        id: group.id,
        name: cleanName,
        code: group.code,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el nombre del grupo' });
  }
});

// Eliminar un grupo completo (solo el creador)
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const currentUserId = req.user.id || req.user.uid;
    if (group.creator_id !== currentUserId) {
      return res.status(403).json({ error: 'Solo el creador puede eliminar el grupo' });
    }

    const tx = db.transaction(() => {
      // Eliminar los miembros del grupo
      db.prepare('DELETE FROM members WHERE group_id = ?').run(id);
      // Eliminar el grupo
      db.prepare('DELETE FROM groups WHERE id = ?').run(id);
    });
    tx();

    res.json({ message: 'Grupo eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar grupo:', err);
    res.status(500).json({ error: 'Error al eliminar el grupo' });
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
               m.validation_status, m.managed_by,
               au.display_name AS assigned_name,
               gu.display_name AS guardian_name
        FROM members m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN users au ON au.id = m.assigned_to
        LEFT JOIN users gu ON gu.id = m.managed_by
        WHERE m.group_id = ?
        ORDER BY m.joined_at
      `)
      .all(id);

    const totalMembers = members.length;
    const approvedCount = members.filter((m) => m.validation_status === 'approved').length;
    const rejectedCount = members.filter((m) => m.validation_status === 'rejected').length;
    const pendingCount = members.filter(
      (m) => !m.validation_status || m.validation_status === 'pending'
    ).length;
    const allApproved = totalMembers >= 2 && approvedCount === totalMembers;

    res.json({
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        assigned: !!group.assigned,
        emails_sent: !!group.emails_sent,
        creator_id: group.creator_id,
        is_creator: group.creator_id === (req.user.id || req.user.uid),
        validationStats: {
          total: totalMembers,
          approved: approvedCount,
          rejected: rejectedCount,
          pending: pendingCount,
          allApproved,
          rejectedBy: members
            .filter((m) => m.validation_status === 'rejected')
            .map((m) => m.display_name || 'Sin nombre'),
        },
      },
      members: members.map((m) => ({
        id: m.user_id,
        name: m.display_name,
        email: m.email && m.email.endsWith('@sin-email.local') ? '' : m.email,
        photo: m.photo_url,
        validationStatus: m.validation_status || 'pending',
        isManaged: Boolean(m.managed_by),
        managedBy: m.managed_by,
        guardianName: m.guardian_name,
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
  const { name, email, sendEmail, isManaged, guardianId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre y apellido son obligatorios' });
  }

  const cleanName = name.trim();
  const isManagedPerson = Boolean(isManaged);

  let cleanEmail = (email || '').trim().toLowerCase();
  if (!isManagedPerson && !cleanEmail) {
    return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
  }

  // Si es persona gestionada (mayor/niño sin email), generar identificador local único
  if (isManagedPerson && !cleanEmail) {
    cleanEmail = `sin-email-${uuidv4().slice(0, 8)}@sin-email.local`;
  }

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (group.creator_id !== (req.user.id || req.user.uid)) {
      return res.status(403).json({ error: 'Solo el creador puede añadir participantes directamente' });
    }

    const wasAssigned = Boolean(group.assigned);

    // Comprobar si ya existe un miembro con este email en el grupo (si no es autogenerado)
    if (!cleanEmail.endsWith('@sin-email.local')) {
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
    }

    // Definir el tutor responsable si es persona gestionada
    let effectiveGuardianId = null;
    if (isManagedPerson) {
      effectiveGuardianId = guardianId || (req.user.id || req.user.uid);
      const isGuardianMember = db
        .prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ?')
        .get(id, effectiveGuardianId);
      if (!isGuardianMember) {
        effectiveGuardianId = req.user.id || req.user.uid;
      }
    }

    // Buscar si el usuario ya existe en la base de datos o crearlo
    let user = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    let userId = user ? user.id : null;

    if (!userId) {
      userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, display_name, photo_url, is_registered, profile_completed)
        VALUES (?, ?, ?, '', 0, 0)
      `).run(userId, cleanEmail, cleanName);
    } else {
      // Actualizar nombre si no tenía
      db.prepare(`
        UPDATE users SET display_name = coalesce(nullif(display_name, ''), ?) WHERE id = ?
      `).run(cleanName, userId);
    }

    const tx = db.transaction(() => {
      // Añadir al grupo con tutor asignado
      db.prepare(`
        INSERT INTO members (id, group_id, user_id, validation_status, managed_by)
        VALUES (?, ?, ?, 'pending', ?)
      `).run(uuidv4(), id, userId, effectiveGuardianId);

      // Si el sorteo ya estaba hecho, se reinicia para que el nuevo miembro quede incluido
      if (wasAssigned) {
        db.prepare(
          `UPDATE members SET assigned_to = NULL, validation_status = 'pending' WHERE group_id = ?`
        ).run(id);
        db.prepare(`UPDATE groups SET assigned = 0, emails_sent = 0 WHERE id = ?`).run(id);
      }
    });
    tx();

    // Enviar correo de invitación con el código y enlace directo (si tiene correo real)
    const shouldSendEmail =
      sendEmail !== false && !isManagedPerson && !cleanEmail.endsWith('@sin-email.local');
    if (shouldSendEmail) {
      const creatorUser = db
        .prepare('SELECT display_name FROM users WHERE id = ?')
        .get(req.user.id || req.user.uid);

      sendGroupInvitationEmail({
        recipientEmail: cleanEmail,
        recipientName: cleanName,
        creatorName: creatorUser?.display_name || 'El organizador',
        groupName: group.name,
        groupCode: group.code,
        groupId: group.id,
      }).catch((err) => console.error('Error enviando invitación por correo:', err.message));
    }

    res.status(201).json({
      message: isManagedPerson
        ? `¡${cleanName} ha sido añadido como participante gestionado por su tutor!`
        : wasAssigned
        ? `Participante añadido. Se ha enviado un email de invitación a ${cleanEmail} y el sorteo se ha reiniciado para incluirlo en la próxima tirada.`
        : shouldSendEmail
        ? `Participante añadido y correo de invitación enviado a ${cleanEmail}.`
        : 'Participante añadido correctamente.',
      resetDraw: wasAssigned,
      member: {
        id: userId,
        name: cleanName,
        email: cleanEmail.endsWith('@sin-email.local') ? '' : cleanEmail,
        isManaged: isManagedPerson,
        managedBy: effectiveGuardianId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al añadir participante' });
  }
});

// Reenviar email de invitación a un participante
router.post('/:id/members/:userId/resend-invite', authenticate, (req, res) => {
  const { id, userId } = req.params;

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (group.creator_id !== (req.user.id || req.user.uid)) {
      return res.status(403).json({ error: 'Solo el creador puede reenviar invitaciones' });
    }

    const member = db
      .prepare(`
        SELECT u.display_name, u.email 
        FROM members m
        JOIN users u ON u.id = m.user_id
        WHERE m.group_id = ? AND m.user_id = ?
      `)
      .get(id, userId);

    if (!member || !member.email) {
      return res.status(404).json({ error: 'Participante no encontrado o sin correo' });
    }

    const creatorUser = db
      .prepare('SELECT display_name FROM users WHERE id = ?')
      .get(req.user.id || req.user.uid);

    sendGroupInvitationEmail({
      recipientEmail: member.email,
      recipientName: member.display_name,
      creatorName: creatorUser?.display_name || 'El organizador',
      groupName: group.name,
      groupCode: group.code,
      groupId: group.id,
    }).catch((err) => console.error('Error reenviando invitación:', err.message));

    res.json({ message: `Invitación reenviada a ${member.email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reenviar la invitación' });
  }
});

// Eliminar un participante del grupo (solo el creador)
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  const { id, userId } = req.params;

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const currentUserId = req.user.id || req.user.uid;
    if (group.creator_id !== currentUserId) {
      return res.status(403).json({ error: 'Solo el creador del grupo puede eliminar participantes' });
    }

    if (userId === group.creator_id) {
      return res.status(400).json({ error: 'El creador no puede ser eliminado del grupo' });
    }

    const member = db
      .prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ?')
      .get(id, userId);

    if (!member) {
      return res.status(404).json({ error: 'El usuario no es miembro de este grupo' });
    }

    const tx = db.transaction(() => {
      // Eliminar el miembro
      db.prepare('DELETE FROM members WHERE group_id = ? AND user_id = ?').run(id, userId);

      // Si el sorteo ya estaba hecho, se reinicia para mantener la integridad del amigo invisible
      if (group.assigned) {
        db.prepare('UPDATE members SET assigned_to = NULL WHERE group_id = ?').run(id);
        db.prepare('UPDATE groups SET assigned = 0 WHERE id = ?').run(id);
      }
    });
    tx();

    res.json({
      message: group.assigned
        ? 'Participante eliminado. El sorteo ha sido reiniciado porque cambió la lista de miembros.'
        : 'Participante eliminado del grupo.',
      resetDraw: Boolean(group.assigned),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar participante' });
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
    // Cero auto-asignaciones garantizado matemáticamente para cualquier n >= 2
    const assignments = [];
    for (let i = 0; i < n; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % n];
      if (giver.user_id === receiver.user_id) {
        throw new Error('Error matemático en el sorteo: auto-asignación detectada');
      }
      assignments.push({ giver, receiver });
    }

    const update = db.prepare(
      `UPDATE members SET assigned_to = ?, validation_status = 'pending' WHERE group_id = ? AND user_id = ?`
    );
    const tx = db.transaction(() => {
      for (const { giver, receiver } of assignments) {
        update.run(receiver.user_id, id, giver.user_id);
      }
      db.prepare(`UPDATE groups SET assigned = 1, emails_sent = 0 WHERE id = ?`).run(id);
    });
    tx();

    res.json({
      message: '¡Sorteo generado! Cada participante debe validar su asignación antes del envío final de los correos.',
      assigned: true,
      participantCount: n,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Error al realizar el sorteo' });
  }
});

// Reiniciar sorteo de un grupo (solo el creador)
router.post('/:id/reset', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (group.creator_id !== (req.user.id || req.user.uid)) {
      return res.status(403).json({ error: 'Solo el creador puede reiniciar el sorteo' });
    }

    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE members SET assigned_to = NULL, validation_status = 'pending' WHERE group_id = ?`
      ).run(id);
      db.prepare(`UPDATE groups SET assigned = 0, emails_sent = 0 WHERE id = ?`).run(id);
    });
    tx();

    res.json({
      message: 'Sorteo reiniciado correctamente. Ahora puedes volver a sortear o modificar participantes.',
      assigned: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reiniciar el sorteo' });
  }
});

// Validar o rechazar asignación por parte de un participante (o su tutor)
router.post('/:id/validate', authenticate, async (req, res) => {
  const { id } = req.params;
  const { action, targetUserId } = req.body; // 'approve' | 'reject'
  const currentUserId = req.user.id || req.user.uid;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Acción inválida. Debe ser approve o reject' });
  }

  try {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (!group.assigned) {
      return res.status(400).json({ error: 'Aún no se ha realizado el sorteo en este grupo' });
    }

    let effectiveUserId = currentUserId;

    if (targetUserId && targetUserId !== currentUserId) {
      const targetMember = db
        .prepare('SELECT * FROM members WHERE group_id = ? AND user_id = ?')
        .get(id, targetUserId);

      if (!targetMember) {
        return res.status(404).json({ error: 'Participante no encontrado en este grupo' });
      }

      // Solo el tutor asignado o el creador del grupo pueden validar en nombre de este participante
      if (targetMember.managed_by !== currentUserId && group.creator_id !== currentUserId) {
        return res
          .status(403)
          .json({ error: 'No tienes permisos para validar en nombre de este participante' });
      }

      effectiveUserId = targetUserId;
    }

    const member = db
      .prepare('SELECT * FROM members WHERE group_id = ? AND user_id = ?')
      .get(id, effectiveUserId);
    if (!member) {
      return res.status(403).json({ error: 'No eres miembro de este grupo' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    db.prepare(
      `UPDATE members SET validation_status = ? WHERE group_id = ? AND user_id = ?`
    ).run(newStatus, id, effectiveUserId);

    // Si un participante rechaza, avisar de inmediato por email al creador del grupo
    if (action === 'reject') {
      try {
        const creator = db
          .prepare(
            `SELECT u.display_name, u.email 
             FROM groups g 
             JOIN users u ON u.id = g.creator_id 
             WHERE g.id = ?`
          )
          .get(id);

        const targetUser = db
          .prepare(`SELECT display_name FROM users WHERE id = ?`)
          .get(effectiveUserId);

        const actorUser = db
          .prepare(`SELECT display_name FROM users WHERE id = ?`)
          .get(currentUserId);

        const rejectorLabel =
          targetUserId && targetUserId !== currentUserId
            ? `${targetUser?.display_name || 'Participante'} (gestionado por ${actorUser?.display_name || 'su tutor'})`
            : actorUser?.display_name || 'Un participante';

        if (creator && creator.email) {
          sendRejectionNoticeToCreator({
            creatorEmail: creator.email,
            creatorName: creator.display_name || 'Creador',
            groupName: group.name,
            groupId: group.id,
            rejectorName: rejectorLabel,
          }).catch((err) =>
            console.error('Error enviando aviso de rechazo al creador:', err.message)
          );
        }
      } catch (noticeErr) {
        console.error('Error obteniendo creador para aviso de rechazo:', noticeErr.message);
      }
    }

    // Comprobar si TODOS los miembros han validado positivamente
    const allMembers = db
      .prepare('SELECT user_id, validation_status FROM members WHERE group_id = ?')
      .all(id);

    const allApproved =
      allMembers.length >= 2 && allMembers.every((m) => m.validation_status === 'approved');

    let emailsTriggered = false;

    if (allApproved && !group.emails_sent) {
      // Marcar correos como enviados
      db.prepare(`UPDATE groups SET emails_sent = 1 WHERE id = ?`).run(id);
      emailsTriggered = true;

      // Obtener asignaciones completas con datos de email
      const assignments = db
        .prepare(`
          SELECT m.user_id, u.display_name AS giver_name, u.email AS giver_email,
                 au.display_name AS receiver_name, au.email AS receiver_email
          FROM members m
          JOIN users u ON u.id = m.user_id
          JOIN users au ON au.id = m.assigned_to
          WHERE m.group_id = ?
        `)
        .all(id);

      for (const item of assignments) {
        if (item.giver_email && !item.giver_email.endsWith('@sin-email.local')) {
          sendAssignmentEmail({
            giverEmail: item.giver_email,
            giverName: item.giver_name,
            receiverName: item.receiver_name,
            receiverEmail: item.receiver_email,
            groupName: group.name,
            groupId: group.id,
          }).catch((err) =>
            console.error(`Error enviando email final a ${item.giver_email}:`, err)
          );
        }
      }
    }

    res.json({
      status: newStatus,
      allApproved,
      emailsTriggered,
      message:
        allApproved
          ? '¡Todos los miembros han validado su asignación! Se han enviado los correos a todos los participantes con email 🎁'
          : action === 'approve'
          ? '¡Validación registrada con éxito! Esperando a que el resto de participantes validen.'
          : 'Se ha indicado que no convence la asignación. El creador del grupo puede volver a sortear.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la validación' });
  }
});

// Obtener mi asignación y la de mis participantes gestionados en un grupo
router.get('/:id/my-assignment', authenticate, (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id || req.user.uid;

  try {
    const group = db.prepare('SELECT assigned, emails_sent FROM groups WHERE id = ?').get(id);
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const member = db
      .prepare(`
        SELECT m.assigned_to, m.validation_status,
               u.display_name AS assigned_name, u.email AS assigned_email
        FROM members m
        LEFT JOIN users u ON u.id = m.assigned_to
        WHERE m.group_id = ? AND m.user_id = ?
      `)
      .get(id, currentUserId);

    // Obtener los participantes que gestiona este usuario (o todos los gestionados si es creador)
    const managedMembers = db
      .prepare(`
        SELECT m.user_id, u.display_name AS member_name, m.assigned_to, m.validation_status,
               au.display_name AS assigned_name
        FROM members m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN users au ON au.id = m.assigned_to
        WHERE m.group_id = ? AND (m.managed_by = ? OR (? = (SELECT creator_id FROM groups WHERE id = ?) AND m.managed_by IS NOT NULL))
      `)
      .all(id, currentUserId, currentUserId, id);

    res.json({
      assigned: Boolean(member && member.assigned_to),
      validationStatus: member?.validation_status || 'pending',
      emailsSent: Boolean(group.emails_sent),
      assignedTo: member?.assigned_to
        ? {
            id: member.assigned_to,
            name: member.assigned_name,
            email: member.assigned_email,
          }
        : null,
      managedAssignments: managedMembers.map((mm) => ({
        userId: mm.user_id,
        name: mm.member_name,
        assignedTo: mm.assigned_to
          ? {
              id: mm.assigned_to,
              name: mm.assigned_name,
            }
          : null,
        validationStatus: mm.validation_status || 'pending',
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tu asignación' });
  }
});

module.exports = router;
