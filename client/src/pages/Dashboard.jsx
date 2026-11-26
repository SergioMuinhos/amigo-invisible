import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProfileModal from '../components/ProfileModal';
import Tooltip from '../components/Tooltip';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createError, setCreateError] = useState('');
  const [joinError, setJoinError] = useState('');

  // Feedback messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (token) {
      loadGroups();
    }
  }, [token]);

  // Si el usuario entra por primera vez con Google y no ha completado nombre/apellidos, mostramos el modal
  useEffect(() => {
    if (user && user.profileCompleted === false) {
      setShowProfileModal(true);
    }
  }, [user]);

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.getGroups(token);
      setGroups(data.groups || []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateError('');
    setCreating(true);
    try {
      const res = await api.createGroup(token, newName.trim());
      setNewName('');
      setShowCreateModal(false);
      setSuccess('¡Grupo creado con éxito! Ya puedes compartir el código.');
      if (res.group?.id) {
        navigate(`/grupo/${res.group.id}`);
      } else {
        await loadGroups();
      }
    } catch (err) {
      setCreateError(err.message || 'No se pudo crear el grupo');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinError('');
    setJoining(true);
    try {
      const res = await api.joinGroup(token, joinCode.trim().toUpperCase());
      setJoinCode('');
      setShowJoinModal(false);
      setSuccess('¡Te has unido al grupo correctamente!');
      if (res.group?.id) {
        navigate(`/grupo/${res.group.id}`);
      } else {
        await loadGroups();
      }
    } catch (err) {
      setJoinError(err.message || 'Código incorrecto o el grupo no existe');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteGroup = async (g) => {
    if (
      !window.confirm(
        `⚠️ ¿Seguro que deseas eliminar el grupo "${g.name}"?\n\nEsta acción borrará a todos los participantes y sorteos de este grupo. No se puede deshacer.`
      )
    ) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await api.deleteGroup(token, g.id);
      setSuccess(res.message || 'Grupo eliminado correctamente');
      await loadGroups();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el grupo');
    }
  };

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Amigo';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Navbar Superior */}
      <nav className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-red-600 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-red-200 dark:shadow-none text-xl font-bold">
                🎁
              </div>
              <div>
                <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 tracking-tight block">
                  Amigo Invisible
                </span>
              </div>
            </div>

            {/* Perfil & Acciones de usuario */}
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />

              <Tooltip text="Editar mi nombre y apellidos">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition transform">
                    {user?.picture ? (
                      <img src={user.picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="hidden xs:block">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 max-w-[120px] sm:max-w-[180px] truncate block leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                      {userDisplayName}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block leading-none mt-0.5">
                      Editar perfil ✏️
                    </span>
                  </div>
                </button>
              </Tooltip>

              <Tooltip text="Cerrar sesión">
                <button
                  onClick={logout}
                  aria-label="Cerrar sesión"
                  className="p-2 sm:px-3 sm:py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition duration-150 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 flex items-center gap-1.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Banner de Bienvenida y Acciones Rápidas */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 rounded-3xl p-6 sm:p-10 text-white shadow-lg shadow-red-200/50 mb-10 relative overflow-hidden">
          <div className="absolute right-0 -bottom-10 opacity-15 pointer-events-none select-none text-9xl">
            🎁
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-sm mb-3">
                ✨ Panel de Control
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                ¡Hola, {userDisplayName}! 👋
              </h1>
              <p className="text-red-100 text-base sm:text-lg mt-2 max-w-xl">
                Organiza tus intercambios de regalos, invita a amigos o únete a un grupo con su código.
              </p>
            </div>

            {/* Botones de acción principales */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-red-600 hover:bg-red-50 font-bold text-base rounded-2xl shadow-md transition transform active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Crear nuevo grupo
              </button>

              <button
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-700/60 hover:bg-red-700 text-white border border-white/30 font-bold text-base rounded-2xl backdrop-blur-sm transition transform active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Unirse con código
              </button>
            </div>
          </div>
        </div>

        {/* Notificaciones / Alertas */}
        {success && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess('')}
              className="text-emerald-600 hover:text-emerald-900 text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-medium flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-rose-600 hover:text-rose-900 text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sección de Grupos */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Tus Grupos
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
            </span>
          </div>
        </div>

        {/* Listado de Grupos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          /* Estado Vacío */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-inner">
              🎁
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Aún no tienes ningún grupo
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mb-8 max-w-md mx-auto">
              Crea tu propio grupo para organizar el sorteo entre amigos o familia, o únete al grupo de otra persona con su código.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary sm:w-auto"
              >
                + Crear mi primer grupo
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-secondary sm:w-auto"
              >
                Tengo un código de invitación
              </button>
            </div>
          </div>
        ) : (
          /* Cuadrícula de Grupos */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {groups.map((g) => {
              const isAssigned = Boolean(g.assigned);
              const isCopied = copiedCode === g.code;

              return (
                <div
                  key={g.id}
                  onClick={() => navigate(`/grupo/${g.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  {/* Barra de color superior sutil */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isAssigned ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  />

                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition truncate flex-1">
                        {g.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {Boolean(g.rejected_count) && g.rejected_count > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                            ⚠️ Repetición ({g.rejected_count})
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                            isAssigned
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAssigned ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                            }`}
                          />
                          {isAssigned ? 'Sorteado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* Metadatos */}
                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5 mb-5">
                      <p className="flex items-center gap-2">
                        <span>👥</span>
                        <span>
                          {g.member_count !== undefined
                            ? `${g.member_count} participante${g.member_count === 1 ? '' : 's'}`
                            : 'Miembros activos'}
                        </span>
                      </p>
                      {g.creator_name && (
                        <p className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                          <span>👑</span>
                          <span>Creado por {g.creator_name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Caja de Código de Invitación */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        Código:
                      </span>
                      <span className="font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 tracking-wider">
                        {g.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Tooltip text="Copiar código de invitación">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(e, g.code)}
                          aria-label="Copiar código de invitación"
                          className="p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center gap-1"
                        >
                          {isCopied ? (
                            <>
                              <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </Tooltip>

                      {g.creator_id === (user?.id || user?.uid) && (
                        <Tooltip text="Eliminar grupo">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(g);
                            }}
                            aria-label="Eliminar grupo"
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
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
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Botón sutil de entrar */}
                  <div className="mt-4 pt-3 flex items-center justify-end text-red-600 dark:text-red-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
                    <span>Ver grupo</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Crear Grupo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl font-bold">
                  🎁
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Crear nuevo grupo
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setCreateError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              {createError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{createError}</span>
                </div>
              )}
              <div>
                <label htmlFor="modalGroupName" className="label-field">
                  Nombre del grupo
                </label>
                <input
                  id="modalGroupName"
                  type="text"
                  autoFocus
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Familia González, Colegas del trabajo..."
                  className="input-field"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Se generará un código único para que tus amigos puedan unirse.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewName('');
                    setCreateError('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Unirse a Grupo */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl font-bold">
                  🔑
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Unirse a un grupo
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                  setJoinError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              {joinError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{joinError}</span>
                </div>
              )}
              <div>
                <label htmlFor="modalJoinCode" className="label-field">
                  Código de invitación
                </label>
                <input
                  id="modalJoinCode"
                  type="text"
                  autoFocus
                  required
                  maxLength={10}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC123"
                  className="input-field text-center font-mono font-bold tracking-widest uppercase text-xl"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Introduce el código de 6 caracteres facilitado por el creador del grupo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                    setJoinError('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="btn-primary flex-1"
                >
                  {joining ? 'Uniéndose...' : 'Unirse al Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar Nombre y Apellidos */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        isFirstTime={user?.profileCompleted === false}
      />
    </div>
  );
}
