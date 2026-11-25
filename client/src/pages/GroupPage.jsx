import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProfileModal from '../components/ProfileModal';

export default function GroupPage() {
  const { id } = useParams();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [myAssignment, setMyAssignment] = useState(null);

  // Modal para añadir participante
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [addError, setAddError] = useState('');
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [resendingMemberId, setResendingMemberId] = useState(null);

  // Notificaciones
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (token && id) {
      loadGroup();
      loadMyAssignment();
    }
  }, [token, id]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const data = await api.getGroup(token, id);
      setGroup(data.group);
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el grupo');
    } finally {
      setLoading(false);
    }
  };

  const loadMyAssignment = async () => {
    try {
      const data = await api.getMyAssignment(token, id);
      setMyAssignment(data);
    } catch (err) {
      console.error('No hay asignación todavía', err.message);
    }
  };

  const handleAssign = async () => {
    setError('');
    setSuccess('');
    setAssigning(true);
    try {
      const res = await api.assignGroup(token, id);
      setSuccess(
        res.message ||
          '¡Sorteo generado! Cada participante debe validar su asignación antes del envío final de correos.'
      );
      await loadGroup();
      await loadMyAssignment();
    } catch (err) {
      setError(err.message || 'No se pudo hacer la asignación del sorteo');
    } finally {
      setAssigning(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Seguro que deseas reiniciar el sorteo? Se borrarán las asignaciones y las validaciones actuales para volver a empezar.')) {
      return;
    }
    setError('');
    setSuccess('');
    setResetting(true);
    try {
      const res = await api.resetGroup(token, id);
      setSuccess(res.message || 'Sorteo reiniciado correctamente.');
      await loadGroup();
      await loadMyAssignment();
    } catch (err) {
      setError(err.message || 'No se pudo reiniciar el sorteo');
    } finally {
      setResetting(false);
    }
  };

  const handleValidate = async (action) => {
    setError('');
    setSuccess('');
    setValidating(true);
    try {
      const res = await api.validateAssignment(token, id, action);
      setSuccess(res.message || 'Validación registrada correctamente.');
      await loadGroup();
      await loadMyAssignment();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la validación');
    } finally {
      setValidating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) {
      setAddError('Por favor, indica el nombre completo y el correo.');
      return;
    }
    setAddError('');
    setAddingMember(true);
    try {
      const res = await api.addMember(token, id, {
        name: addName.trim(),
        email: addEmail.trim(),
        sendEmail: sendInviteEmail,
      });
      setAddName('');
      setAddEmail('');
      setShowAddModal(false);
      setSuccess(res.message || `¡${addName.trim()} ha sido añadido al grupo!`);
      await loadGroup();
      if (res.resetDraw) {
        await loadMyAssignment();
      }
    } catch (err) {
      setAddError(err.message || 'No se pudo añadir al participante');
    } finally {
      setAddingMember(false);
    }
  };

  const handleResendInvite = async (member) => {
    setResendingMemberId(member.id);
    setError('');
    setSuccess('');
    try {
      const res = await api.resendInvite(token, id, member.id);
      setSuccess(res.message || `Invitación enviada por correo a ${member.email}`);
    } catch (err) {
      setError(err.message || 'No se pudo enviar la invitación por correo');
    } finally {
      setResendingMemberId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    const warningMsg = group?.assigned
      ? `¿Seguro que deseas eliminar a "${member.name}" del grupo?\n\n⚠️ Como el sorteo ya se había realizado, al eliminar a este participante el sorteo se reiniciará para que puedas volver a sortear entre los miembros restantes.`
      : `¿Seguro que deseas eliminar a "${member.name}" del grupo?`;

    if (!window.confirm(warningMsg)) return;

    setDeletingMemberId(member.id);
    setError('');
    setSuccess('');
    try {
      const res = await api.removeMember(token, id, member.id);
      setSuccess(res.message || 'Participante eliminado.');
      await loadGroup();
      await loadMyAssignment();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar al participante');
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleCopyCode = () => {
    if (group?.code) {
      navigator.clipboard.writeText(group.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const isCreator = Boolean(
    group?.is_creator ||
      (group?.creator_id && user?.uid && group.creator_id === user.uid) ||
      (group?.creator_id && user?.id && group.creator_id === user.id)
  );

  const currentUid = user?.id || user?.uid;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce">🎁</div>
          <p className="text-lg font-semibold">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center shadow-lg">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {error || 'Grupo no encontrado'}
          </h1>
          <p className="text-slate-500 mb-6 text-sm">
            Verifica que tengas acceso o que el código de invitación sea el correcto.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Volver a mis grupos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navegación superior */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Volver al panel"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm sm:text-base py-2 px-3 rounded-xl hover:bg-slate-100 transition"
            >
              <span>←</span>
              <span>Volver a grupos</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                title="Editar mi nombre y apellidos"
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 group-hover:scale-105 transition transform">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
                  )}
                </div>
                <div className="hidden xs:block">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 max-w-[120px] sm:max-w-[160px] truncate block leading-tight group-hover:text-red-600 transition">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-none mt-0.5">
                    Editar perfil ✏️
                  </span>
                </div>
              </button>

              <button
                onClick={logout}
                className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-red-600 py-2 px-3 rounded-xl hover:bg-red-50 border border-slate-200 hover:border-red-200 transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Cabecera del Grupo */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {group.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    group.assigned
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      group.assigned ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  {group.assigned ? 'Sorteo realizado' : 'Pendiente de sorteo'}
                </span>
                {isCreator && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    👑 Creador del grupo
                  </span>
                )}
              </div>

              {/* Código de Invitación con copia rápida */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-sm font-medium text-slate-500">
                  Código de invitación:
                </span>
                <span className="font-mono font-bold text-base bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200 tracking-widest">
                  {group.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1"
                >
                  {copiedCode ? (
                    <>
                      <span className="text-emerald-600">✓</span>
                      <span className="text-emerald-600">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copiar código</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Acciones principales del Creador */}
            {isCreator && (
              <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 flex-wrap">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-secondary sm:w-auto text-sm"
                >
                  + Añadir participante
                </button>

                {!group.assigned ? (
                  <button
                    onClick={handleAssign}
                    disabled={assigning || members.length < 2}
                    className="btn-primary sm:w-auto text-sm"
                  >
                    {assigning ? 'Realizando sorteo...' : '🎲 Realizar Sorteo Aleatorio'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAssign}
                      disabled={assigning}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-200 transition transform active:scale-95 disabled:opacity-50"
                      title="Genera una nueva combinación aleatoria"
                    >
                      {assigning ? 'Sorteando...' : '🎲 Volver a sortear'}
                    </button>

                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      title="Reinicia el sorteo al estado inicial"
                    >
                      <span>🔄</span>
                      <span>{resetting ? 'Reiniciando...' : 'Reiniciar sorteo'}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notificaciones */}
        {success && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess('')}
              className="text-emerald-600 hover:text-emerald-900 font-bold p-1 text-lg"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-medium flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-rose-600 hover:text-rose-900 font-bold p-1 text-lg"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notificación destacada para el Creador si alguien rechazó el sorteo */}
        {isCreator && group.assigned && group.validationStats?.rejected > 0 && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start sm:items-center gap-3.5">
              <span className="text-3xl sm:text-4xl">🔔</span>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 mb-1">
                  Atención Creador
                </span>
                <h3 className="font-black text-base sm:text-lg">
                  Un participante ha solicitado repetir el sorteo
                </h3>
                <p className="text-xs sm:text-sm text-amber-800 mt-0.5 max-w-xl">
                  {group.validationStats.rejectedBy?.length > 0
                    ? `Participante(s) no conformes: ${group.validationStats.rejectedBy.join(', ')}. No le convence su asignación y solicitan un nuevo sorteo.`
                    : 'Uno de los participantes ha indicado que no le convence su amigo asignado.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleAssign}
              disabled={assigning}
              className="px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md shadow-amber-200 transition transform active:scale-95 shrink-0 flex items-center justify-center gap-2"
            >
              <span>🎲</span>
              <span>{assigning ? 'Sorteando...' : 'Volver a sortear ahora'}</span>
            </button>
          </div>
        )}

        {/* Tu Amigo Invisible (Revelación) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎁</span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Tu Amigo Invisible
            </h2>
          </div>

          {myAssignment?.assigned && myAssignment?.assignedTo ? (
            <div className="bg-gradient-to-tr from-rose-50 to-red-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8 text-center sm:text-left">
              <span className="text-xs uppercase font-extrabold text-red-600 tracking-wider block mb-2">
                ✨ Te ha tocado regalarle a ✨
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-red-700 mb-1">
                {myAssignment.assignedTo.name}
              </div>
              <p className="text-slate-600 text-sm sm:text-base font-medium">
                {myAssignment.assignedTo.email}
              </p>
              <div className="mt-4 pt-4 border-t border-red-200/60 text-xs sm:text-sm text-slate-500 flex items-center gap-2 justify-center sm:justify-start">
                <span>🤫</span>
                <span>
                  Solo tú puedes ver este resultado. ¡Guarda el secreto hasta la entrega de regalos!
                </span>
              </div>

              {/* Bloque de validación individual */}
              <div className="mt-6 pt-6 border-t border-red-200/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 p-4 sm:p-5 rounded-2xl border border-red-100 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                      <span>🗳️</span>
                      <span>¿Confirmas tu asignación?</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-md">
                      Una vez que todos los participantes pulsen <strong>"Validar"</strong>, se enviarán automáticamente los correos definitivos a cada uno.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => handleValidate('approve')}
                      disabled={validating}
                      className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl font-bold text-sm transition transform active:scale-95 flex items-center justify-center gap-2 ${
                        myAssignment.validationStatus === 'approved'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-2'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-300'
                      }`}
                    >
                      <span>👍</span>
                      <span>
                        {myAssignment.validationStatus === 'approved' ? 'Validado ✓' : 'Validar'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleValidate('reject')}
                      disabled={validating}
                      className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl font-bold text-sm transition transform active:scale-95 flex items-center justify-center gap-2 ${
                        myAssignment.validationStatus === 'rejected'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-600 ring-offset-2'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-2 border-rose-300'
                      }`}
                    >
                      <span>👎</span>
                      <span>
                        {myAssignment.validationStatus === 'rejected'
                          ? 'Rechazado ✕'
                          : 'No me gusta'}
                      </span>
                    </button>
                  </div>
                </div>

                {myAssignment.validationStatus === 'approved' && (
                  <p className="text-xs text-emerald-700 font-semibold mt-2.5 flex items-center gap-1.5">
                    <span>✓</span>
                    <span>
                      Has validado tu asignación. En cuanto todos los miembros validen, se enviarán los emails oficiales.
                    </span>
                  </p>
                )}
                {myAssignment.validationStatus === 'rejected' && (
                  <p className="text-xs text-rose-700 font-semibold mt-2.5 flex items-center gap-1.5">
                    <span>✕</span>
                    <span>
                      Has indicado que no te convence. El creador del grupo puede pulsar "Volver a sortear".
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 text-center sm:text-left space-y-4">
              <div className="flex items-center gap-3 text-slate-700 font-semibold text-lg">
                <span>⏳</span>
                <span>Aún no se ha realizado el sorteo</span>
              </div>

              {isCreator ? (
                <div>
                  <p className="text-slate-600 text-sm sm:text-base mb-4">
                    Como creador del grupo, cuando todos los amigos o familiares se hayan unido,
                    pulsa el botón para realizar el sorteo automático.
                  </p>
                  {members.length < 2 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
                      ⚠️ Se necesitan al menos <strong>2 personas</strong> en el grupo para realizar el sorteo. Añade participantes con el botón o comparte el código.
                    </div>
                  ) : (
                    <button
                      onClick={handleAssign}
                      disabled={assigning}
                      className="btn-primary sm:w-auto"
                    >
                      {assigning ? 'Realizando sorteo...' : '🎲 Realizar Sorteo Aleatorio'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-sm sm:text-base">
                  El creador del grupo aún no ha iniciado el sorteo. En cuanto lo realice, recibirás un aviso y verás aquí a quién te ha tocado para validar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progreso Global de Validaciones */}
        {group.assigned && group.validationStats && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block mb-1">
                  Progreso de Confirmación del Grupo
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>📊</span>
                  <span>
                    {group.validationStats.approved} de {group.validationStats.total} participantes han validado
                  </span>
                </h3>
              </div>

              {group.emails_sent ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✉️ Correos oficiales enviados
                </span>
              ) : group.validationStats.allApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  🎉 ¡100% Validado! Enviando correos...
                </span>
              ) : group.validationStats.rejected > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  ⚠️ {group.validationStats.rejected} participante(s) han pedido repetir
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  ⏳ Esperando validaciones
                </span>
              )}
            </div>

            {/* Barra de progreso visual */}
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  group.validationStats.rejected > 0
                    ? 'bg-amber-500'
                    : group.validationStats.allApproved
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                style={{
                  width: `${Math.round(
                    (group.validationStats.approved / Math.max(group.validationStats.total, 1)) * 100
                  )}%`,
                }}
              />
            </div>

            {group.emails_sent && (
              <p className="text-xs sm:text-sm text-emerald-700 font-semibold mt-3 flex items-center gap-2">
                <span>🎁</span>
                <span>
                  ¡Todo listo! Cada participante ha recibido su correo discreto con su asignación definitiva.
                </span>
              </p>
            )}
          </div>
        )}

        {/* Lista de Miembros */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span>👥</span>
                <span>Miembros del grupo ({members.length})</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Personas que participan en este amigo invisible
              </p>
            </div>

            {isCreator && !group.assigned && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-secondary sm:w-auto text-sm"
              >
                + Añadir participante
              </button>
            )}
          </div>

          {/* Tabla de Miembros */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5 rounded-l-xl">Nombre y Apellido</th>
                  <th className="px-5 py-3.5">Correo electrónico</th>
                  <th className="px-5 py-3.5 text-right">Rol</th>
                  {group.assigned && (
                    <th className="px-5 py-3.5 text-center">Confirmación</th>
                  )}
                  {isCreator && (
                    <th className="px-5 py-3.5 rounded-r-xl text-center">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isCurrent = m.id === currentUid;
                  const isMemberCreator = m.id === group.creator_id;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                            {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm sm:text-base block">
                              {m.name || 'Sin nombre'}
                            </span>
                            {isCurrent && (
                              <span className="text-xs text-red-600 font-semibold">
                                (Tú)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                        {m.email}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isMemberCreator ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            👑 Creador
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Participante
                          </span>
                        )}
                      </td>
                      {group.assigned && (
                        <td className="px-5 py-4 text-center">
                          {m.validationStatus === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Validado
                            </span>
                          ) : m.validationStatus === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              ✕ No conforme
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              ⏳ Pendiente
                            </span>
                          )}
                        </td>
                      )}
                      {isCreator && (
                        <td className="px-5 py-4 text-center">
                          {!isMemberCreator ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleResendInvite(m)}
                                disabled={resendingMemberId === m.id}
                                title={`Enviar / Reenviar correo de invitación a ${m.email}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-xl transition duration-150 active:scale-95 disabled:opacity-50"
                              >
                                <span>✉️</span>
                                <span>
                                  {resendingMemberId === m.id ? 'Enviando...' : 'Invitar'}
                                </span>
                              </button>

                              <button
                                onClick={() => handleRemoveMember(m)}
                                disabled={deletingMemberId === m.id}
                                title={`Eliminar a ${m.name} del grupo`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition duration-150 active:scale-95 disabled:opacity-50"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                <span>
                                  {deletingMemberId === m.id ? 'Eliminando...' : 'Eliminar'}
                                </span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal para que el creador añada participantes directamente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">
                  👤
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Añadir participante
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-2 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              {addError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label htmlFor="participantName" className="label-field">
                  Nombre y Apellido
                </label>
                <input
                  id="participantName"
                  type="text"
                  autoFocus
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Ej: Laura Pérez"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="participantEmail" className="label-field">
                  Correo electrónico
                </label>
                <input
                  id="participantEmail"
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="laura@ejemplo.com"
                  className="input-field"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Se enviará a este correo el amigo que le haya tocado tras el sorteo.
                </p>
              </div>

              {/* Opción de enviar email de invitación con el enlace y código */}
              <div
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 cursor-pointer select-none"
                onClick={() => setSendInviteEmail(!sendInviteEmail)}
              >
                <input
                  type="checkbox"
                  id="modalSendInvite"
                  checked={sendInviteEmail}
                  onChange={(e) => setSendInviteEmail(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <label
                  htmlFor="modalSendInvite"
                  className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  ✉️ Enviar correo de invitación con el enlace directo y código para unirse al grupo
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingMember || !addName.trim() || !addEmail.trim()}
                  className="btn-primary flex-1"
                >
                  {addingMember ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar Nombre y Apellidos */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          loadGroup();
        }}
        isFirstTime={false}
      />
    </div>
  );
}
