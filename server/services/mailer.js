const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let resendClient = null;
let smtpTransporter = null;

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  let pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
  if (pass && (process.env.SMTP_SERVICE === 'gmail' || (user && user.endsWith('@gmail.com')))) {
    // Si es Gmail y tiene espacios (formato típico de Google 'xxxx yyyy zzzz wwww'), los quitamos
    pass = pass.replace(/\s+/g, '');
  }

  if (user && pass) {
    if (process.env.SMTP_SERVICE === 'gmail' || (!host && user.endsWith('@gmail.com'))) {
      smtpTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        tls: {
          servername: 'smtp.gmail.com',
        },
        auth: { user, pass },
      });
    } else if (host) {
      smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  return smtpTransporter;
}

function getResendClient() {
  if (resendClient) return resendClient;
  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function isEmailConfigured() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  let pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
  if (pass && (process.env.SMTP_SERVICE === 'gmail' || (user && user.endsWith('@gmail.com')))) {
    // Si es Gmail y tiene espacios (formato típico de Google 'xxxx yyyy zzzz wwww'), los quitamos
    pass = pass.replace(/\s+/g, '');
  }
  if (user && pass) return true;
  if (process.env.RESEND_API_KEY) return true;
  return false;
}

/**
 * Envía un correo con el amigo invisible asignado de forma discreta y elegante.
 * El nombre de la persona asignada NUNCA aparece en el asunto del correo.
 */
async function sendAssignmentEmail({
  giverEmail,
  giverName,
  receiverName,
  receiverEmail,
  groupName,
  groupId,
}) {
  // Asunto discreto (NO revela a quién le ha tocado para evitar spoilers en notificaciones)
  const subject = `🎁 Tu Amigo Invisible - Grupo: ${groupName}`;

  const webUrl = process.env.APP_URL || 'http://localhost:3000';
  const groupUrl = `${webUrl}/grupo/${groupId}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Amigo Invisible</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Cabecera -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #e11d48 100%); padding: 36px 30px; text-align: center;">
              <div style="font-size: 42px; line-height: 1; margin-bottom: 12px;">🎁</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Amigo Invisible</h1>
              <p style="margin: 6px 0 0; color: #ffe4e6; font-size: 15px; font-weight: 500;">Grupo: ${groupName}</p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px; font-size: 17px; line-height: 1.5; color: #334155;">
                ¡Hola, <strong>${giverName || 'Amigo'}</strong>! 👋
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">
                ¡El sorteo ya se ha completado! En este intercambio de regalos, tu misión secreta es regalarle a:
              </p>

              <!-- Tarjeta destacada con la persona asignada -->
              <div style="background-color: #fff1f2; border: 2px dashed #f43f5e; border-radius: 18px; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #e11d48; margin-bottom: 6px;">
                  ✨ Te ha tocado regalar a ✨
                </span>
                <span style="display: block; font-size: 26px; font-weight: 800; color: #be123c; margin-bottom: 4px;">
                  ${receiverName}
                </span>
                ${receiverEmail ? `<span style="display: block; font-size: 14px; color: #9f1239; opacity: 0.85;">(${receiverEmail})</span>` : ''}
              </div>

              <!-- Mensaje de discreción -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5; text-align: center;">
                  🤫 <strong>¡Recuerda que es un secreto!</strong> No le digas a nadie quién te ha tocado hasta el momento de entregar los regalos.
                </p>
              </div>

              <!-- Botón CTA -->
              <div style="text-align: center; margin-bottom: 12px;">
                <a href="${groupUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 14px; box-shadow: 0 2px 6px rgba(220,38,38,0.25);">
                  Ver detalles del grupo
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Has recibido este mensaje porque eres parte del grupo "${groupName}" en Amigo Invisible.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // 1. Prioridad: Envío con Gmail / SMTP (permite enviar a cualquier correo de amigos o familiares)
  const mailTransporter = getSmtpTransporter();
  if (mailTransporter) {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@amigoinvisible.app';
    try {
      const info = await mailTransporter.sendMail({
        from: `"Amigo Invisible" <${fromAddress}>`,
        to: giverEmail,
        subject,
        html: htmlContent,
        text: `¡Hola ${giverName}! En el grupo "${groupName}", te ha tocado regalarle a: ${receiverName}. ¡Recuerda guardar el secreto! Más info en: ${groupUrl}`,
      });
      console.log(`[GMAIL ENVIADO CON ÉXITO] A: ${giverEmail} -> ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[GMAIL ERROR] A: ${giverEmail}:`, err.message);
      // Fallback a Resend si Gmail fallara
    }
  }

  // 2. Envío con Resend API
  const resend = getResendClient();
  if (resend) {
    try {
      const from = process.env.EMAIL_FROM || 'Amigo Invisible <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from,
        to: giverEmail,
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error(`[RESEND ERROR] A: ${giverEmail}:`, error.message || error);
        return { success: false, error: error.message };
      }

      console.log(`[RESEND ENVIADO CON ÉXITO] A: ${giverEmail} -> ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error(`[RESEND EXCEPCIÓN] A: ${giverEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // 3. Simulación si no hay credenciales
  console.log(`\n======================================================`);
  console.log(`[EMAIL SIMULADO - Sin credenciales de correo]`);
  console.log(`Para: ${giverEmail} (${giverName})`);
  console.log(`Asunto discreto: ${subject}`);
  console.log(`Amigo invisible asignado: ${receiverName} (${receiverEmail})`);
  console.log(`Grupo: ${groupName}`);
  console.log(`======================================================\n`);
  return { success: true, simulated: true };
}

/**
 * Notifica al creador del grupo cuando un participante rechaza su asignación
 * y solicita que se repita el sorteo.
 */
async function sendRejectionNoticeToCreator({
  creatorEmail,
  creatorName,
  groupName,
  groupId,
  rejectorName,
}) {
  if (!creatorEmail) return { success: false, error: 'Email del creador no especificado' };

  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const groupUrl = `${appUrl}/grupo/${groupId}`;

  const subject = `⚠️ Solicitud de nuevo sorteo en "${groupName}"`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitud de repetición de sorteo</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 24px; }
        .alert-box { background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 18px; margin: 20px 0; text-align: left; }
        .button { display: inline-block; background-color: #dc2626; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: bold; font-size: 15px; margin-top: 15px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="font-size: 40px; margin-bottom: 8px;">🎲</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Solicitud de Repetición de Sorteo</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 15px;">Grupo: <strong>${groupName}</strong></p>
        </div>
        <div class="body">
          <p style="font-size: 16px; margin-top: 0;">Hola <strong>${creatorName}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5; color: #475569;">
            Te avisamos como creador del grupo de que <strong>${rejectorName}</strong> ha indicado que <strong>no le convence su amigo invisible asignado</strong> y solicita que se vuelva a realizar el sorteo.
          </p>
          
          <div class="alert-box">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #92400e; font-size: 15px;">¿Qué puedes hacer?</p>
            <p style="margin: 0; font-size: 14px; color: #b45309; line-height: 1.4;">
              Accede a la web del grupo y pulsa el botón <strong>"Volver a sortear"</strong> para generar una nueva combinación aleatoria para todos los participantes.
            </p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${groupUrl}" class="button">Abrir grupo y volver a sortear 🎲</a>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">Amigo Invisible · Notificación automática para el creador del grupo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Envío vía Gmail o Resend
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER;
      const info = await smtp.sendMail({
        from: `Amigo Invisible <${from}>`,
        to: creatorEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[AVISO CREADOR ENVIADO GMAIL] A: ${creatorEmail} -> ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[AVISO CREADOR ERROR GMAIL] A: ${creatorEmail}:`, err.message);
    }
  }

  const resend = getResendClient();
  if (resend) {
    try {
      const from = process.env.EMAIL_FROM || 'Amigo Invisible <onboarding@resend.dev>';
      const { data } = await resend.emails.send({
        from,
        to: creatorEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[AVISO CREADOR ENVIADO RESEND] A: ${creatorEmail} -> ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error(`[AVISO CREADOR ERROR RESEND]:`, err.message);
    }
  }

  console.log(`[AVISO CREADOR SIMULADO] A: ${creatorEmail} por rechazo de ${rejectorName}`);
  return { success: true, simulated: true };
}

/**
 * Envía una invitación por correo a un participante con el enlace directo y el código para unirse al grupo.
 */
async function sendGroupInvitationEmail({
  recipientEmail,
  recipientName,
  creatorName,
  groupName,
  groupCode,
  groupId,
}) {
  if (!recipientEmail) return { success: false, error: 'Email del destinatario no especificado' };

  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const joinUrl = `${appUrl}/login?join=${groupCode}`;

  const subject = `🎁 ${creatorName} te ha invitado al Amigo Invisible en "${groupName}"`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación a Amigo Invisible</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #e11d48, #be123c); padding: 36px 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 24px; text-align: center; }
        .code-box { background-color: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center; }
        .code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #be123c; }
        .button { display: inline-block; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 16px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.35); margin-top: 10px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="font-size: 48px; margin-bottom: 8px;">🎁</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">¡Has sido invitado al Amigo Invisible!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 16px;">Grupo: <strong>${groupName}</strong></p>
        </div>
        <div class="body">
          <p style="font-size: 16px; margin-top: 0; text-align: left;">
            Hola <strong>${recipientName || 'amigo/a'}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; text-align: left;">
            <strong>${creatorName}</strong> te ha invitado a participar en el intercambio de regalos de Amigo Invisible para el grupo <strong>"${groupName}"</strong>.
          </p>

          <div class="code-box">
            <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #9f1239; letter-spacing: 1px; display: block; margin-bottom: 6px;">Código de invitación</span>
            <div class="code">${groupCode}</div>
          </div>

          <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
            Haz clic en el siguiente botón para unirte directamente a la fiesta:
          </p>

          <div>
            <a href="${joinUrl}" class="button">Unirme al Grupo de Regalos ✨</a>
          </div>

          <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
            O entra en <a href="${appUrl}" style="color: #e11d48; text-decoration: underline;">${appUrl}</a> e introduce el código manualmente: <strong>${groupCode}</strong>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Amigo Invisible · La forma más fácil de organizar sorteos</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Envío vía Gmail SMTP o Resend
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER;
      const info = await smtp.sendMail({
        from: `Amigo Invisible <${from}>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[INVITACIÓN ENVIADA GMAIL] A: ${recipientEmail} -> ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[INVITACIÓN ERROR GMAIL] A: ${recipientEmail}:`, err.message);
    }
  }

  const resend = getResendClient();
  if (resend) {
    try {
      const from = process.env.EMAIL_FROM || 'Amigo Invisible <onboarding@resend.dev>';
      const { data } = await resend.emails.send({
        from,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[INVITACIÓN ENVIADA RESEND] A: ${recipientEmail} -> ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error(`[INVITACIÓN ERROR RESEND]:`, err.message);
    }
  }

  console.log(`[INVITACIÓN SIMULADA] A: ${recipientEmail} (${recipientName}) para grupo ${groupName} con código ${groupCode}`);
  return { success: true, simulated: true };
}

module.exports = {
  sendAssignmentEmail,
  sendRejectionNoticeToCreator,
  sendGroupInvitationEmail,
  isEmailConfigured,
};
