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
      setError('No se pudo cargar el grupo');
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
      setSuccess('¡Asignación hecha! Cada persona ya sabe a quién le tocó');
      await loadGroup();
      await loadMyAssignment();
    } catch (err) {
      setError('No se pudo hacer la asignación');
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
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {error || 'Grupo no encontrado'}
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Volver a grupos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Volver a grupos"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-2xl">←</span>
              <span className="hidden sm:inline text-lg font-medium">Volver</span>
            </button>

            <div className="hidden md:flex items-center gap-6">
              <span className="text-base text-gray-600">
                👤 {user?.email || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="px-6 py-3 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
                className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                <span className="text-2xl">☰</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-300 px-4 pb-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-4">
            <span className="text-base text-gray-600 truncate max-w-xs">
              {user?.email || 'Usuario'}
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-4 px-4 text-left text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      <div className="page-container max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {group.name}
          </h1>
          <p className="text-gray-600 text-lg">
            🔑 Código del grupo: <span className="font-mono font-bold text-gray-800">{group.code}</span>
          </p>
        </div>

        {success && (
          <div className="mb-6 p-5 rounded-2xl bg-green-50 border border-green-200 text-lg text-green-700 font-medium shadow-sm">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-5 rounded-2xl bg-red-50 border border-red-200 text-lg text-red-700 font-medium shadow-sm">
            ❌ {error}
          </div>
        )}

        {/* Tu amigo invisible - lo más importante */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎁 Tu amigo invisible
          </h2>
          {myAssignment?.assigned && myAssignment?.assignedTo ? (
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-600">
                Te ha tocado regalarle a:
              </p>
              <div className="inline-block p-6 bg-red-50 border-4 border-red-200 rounded-3xl">
                <div className="text-4xl sm:text-5xl font-bold text-red-600 mb-2">
                  {myAssignment.assignedTo.name}
                </div>
                <p className="text-lg text-gray-600">
                  {myAssignment.assignedTo.email}
                </p>
              </div>
              <p className="text-lg text-gray-500">
                Solo tú puedes ver esta información. ¡Es un secreto!
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              <p className="text-lg text-gray-600">
                Aún no se ha hecho el sorteo
              </p>
              {group.assigned && (
                <p className="text-lg text-red-500">
                  El creador aún no ha asignado los amigos invisibles
                </p>
              )}
              {!group.assigned && isCreator && members.length >= 2 && (
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="btn-primary"
                >
                  {assigning ? 'Asignando...' : 'Hacer sorteo aleatorio'}
                </button>
              )}
              {!group.assigned && !isCreator && (
                <p className="text-lg text-gray-500">
                  Espera a que el creador del grupo haga el sorteo
                </p>
              )}
              {!group.assigned && members.length < 2 && (
                <p className="text-lg text-gray-500">
                  Se necesitan al menos 2 personas para hacer el sorteo
                </p>
              )}
            </div>
          )}
        </div>

        {/* Botón asignar versión desktop */}
        {isCreator && !group.assigned && members.length >= 2 && (
          <div className="mb-8 hidden sm:block">
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="btn-primary"
            >
              {assigning ? 'Asignando...' : 'Hacer sorteo aleatorio'}
            </button>
          </div>
        )}

        {/* Miembros */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              👥 Miembros ({members.length})
            </h2>
            {!isCreator && (
              <p className="text-lg text-gray-500">
                Solo el creador puede hacer el sorteo
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 uppercase">
                    Correo electrónico
                  </th>
                  <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 uppercase">
                    Le tocó a
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg sm:text-xl font-bold">
                          {m.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-lg font-medium text-gray-800">
                          {m.name}
                        </span>
                        {m.id === currentUid && (
                          <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                            Tú
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-600">
                      {m.email}
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-600">
                      {m.assignedTo ? (
                        <span className="font-bold text-green-600">
                          ✅ {m.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500 text-xl">
                      Sin miembros todavía
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
