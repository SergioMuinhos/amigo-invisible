import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose, isFirstTime = false }) {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      if (user.firstName || user.lastName) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
      } else if (user.name) {
        const parts = user.name.trim().split(' ');
        if (parts.length > 1) {
          setFirstName(parts[0]);
          setLastName(parts.slice(1).join(' '));
        } else {
          setFirstName(user.name);
          setLastName('');
        }
      }
      setError('');
    }
  }, [isOpen, user]);

  // Accesibilidad: Cerrar con tecla Escape (si no es primera vez obligatoria)
  useEffect(() => {
    if (!isOpen || isFirstTime) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirstTime, onClose]);

  if (!isOpen) return null;

  const previewName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Tu Nombre y Apellidos';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Por favor, indica al menos tu nombre.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={(e) => {
        if (!isFirstTime && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all">
        {/* Encabezado decorativo */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 p-6 sm:p-8 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
              {isFirstTime ? '👋' : '✏️'}
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-xl sm:text-2xl font-black tracking-tight">
                {isFirstTime ? '¡Bienvenido/a!' : 'Mi Perfil'}
              </h2>
              <p className="text-red-100 text-sm mt-1">
                {isFirstTime
                  ? '¿Cómo quieres que te reconozcan en tus grupos?'
                  : 'Modifica tu nombre y apellidos'}
              </p>
            </div>
          </div>

          {!isFirstTime && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 rounded-xl text-red-700 dark:text-red-300 text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {isFirstTime && (
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 p-3.5 rounded-2xl">
              💡 <strong>Consejo:</strong> Pon tu nombre y primer apellido real para que tus familiares o amigos sepan quién eres en el sorteo.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-firstName" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-firstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Sergio"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-950 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="profile-lastName" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Apellidos
              </label>
              <input
                id="profile-lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. García López"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-950 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Vista previa en vivo */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-2">
              Vista previa en los grupos
            </span>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0 overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  (firstName[0] || user?.email?.[0] || '?').toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{previewName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 pt-2">
            {!isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3.5 px-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-200 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isFirstTime ? 'Guardar y entrar' : 'Guardar cambios'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
