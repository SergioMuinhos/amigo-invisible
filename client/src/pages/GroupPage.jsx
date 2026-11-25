import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function GroupPage() {
  const { id } = useParams();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [myAssignment, setMyAssignment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadGroup();
    loadMyAssignment();
  }, [token, id]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const data = await api.getGroup(token, id);
      setGroup(data.group);
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || 'Error al cargar el grupo');
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
    setAssigning(true);
    try {
      await api.assignGroup(token, id);
      setSuccess('¡Asignación realizada! Cada miembro ya sabe a quién le toca.');
      await loadGroup();
      await loadMyAssignment();
    } catch (err) {
      setError(err.message || 'Error al asignar');
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isCreator = group?.creator_id === (user?.id || user?.uid);
  const currentUid = user?.id || user?.uid;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando grupo...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">{error || 'Grupo no encontrado'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-lg">←</span>
              <span className="hidden sm:inline">Volver</span>
            </button>

            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pb-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-2">
              <span className="text-sm text-gray-600 truncate max-w-xs">{user?.email}</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8 safe-bottom">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">{group.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Código: <span className="font-mono text-gray-700">{group.code}</span>
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 sm:p-4 rounded-xl bg-green-50 border border-green-200 text-sm sm:text-base text-green-700 shadow-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-sm sm:text-base text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Mi asignación - destacada en móvil */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 sm:text-xl">
            Tu amigo invisible
          </h2>
          {myAssignment?.assigned && myAssignment?.assignedTo ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-wider">
                  Te ha tocado:
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {myAssignment.assignedTo.name}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  {myAssignment.assignedTo.email}
                </p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl sm:text-2xl">
                {myAssignment.assignedTo.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">Aún no se ha realizado la asignación.</p>
              {group.assigned && (
                <p className="text-sm text-red-500 mt-2">
                  El creador aún no ha asignado los amigos.
                </p>
              )}
              {!group.assigned && isCreator && members.length >= 2 && (
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="mt-4 w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm sm:text-base disabled:opacity-60 transition active:scale-95"
                >
                  {assigning ? 'Asignando...' : 'Hacer asignación aleatoria'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Botón asignar (versión desktop visible también arriba si es creator) */}
        {isCreator && !group.assigned && members.length >= 2 && (
          <div className="mb-6 hidden sm:block">
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition active:scale-95 disabled:opacity-60"
            >
              {assigning ? 'Asignando...' : 'Hacer asignación aleatoria'}
            </button>
          </div>
        )}

        {/* Miembros */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              Miembros ({members.length})
            </h2>
            {!isCreator && (
              <p className="text-sm text-gray-500">
                Solo el creador puede asignar.
              </p>
            )}
          </div>

          <div className="overflow-x-auto border-b border-gray-200">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 sticky top-0">
                  <th className="px-5 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase">
                    Nombre
                  </th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase">
                    Correo
                  </th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tiene asignado a
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs sm:text-sm font-medium">
                          {m.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-gray-800 font-medium text-sm sm:text-base">
                          {m.name}
                        </span>
                        {m.id === currentUid && (
                          <span className="ml-auto text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Tú
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-gray-600 text-sm sm:text-base">
                      {m.email}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-gray-600 text-sm sm:text-base">
                      {m.assignedTo ? (
                        <span className="font-medium">{m.assignedTo.name}</span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-5 py-6 text-center text-gray-500">
                      Sin miembros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
