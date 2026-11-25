import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [token]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.getGroups(token);
      setGroups(data.groups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.createGroup(token, newName);
      setNewName('');
      setSuccess('¡Grupo creado correctamente!');
      await loadGroups();
    } catch (err) {
      setError('No se pudo crear el grupo. Inténtalo de nuevo');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setJoining(true);
    try {
      await api.joinGroup(token, joinCode);
      setJoinCode('');
      setSuccess('Te has unido al grupo');
      await loadGroups();
    } catch (err) {
      setError('Código incorrecto o el grupo no existe');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav muy simple */}
      <nav className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                🎁
              </div>
              <span className="font-bold text-2xl text-gray-800 tracking-tight">
                Amigo Invisible
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <span className="text-base text-gray-600">
                👤 {user?.email || 'Usuario'}
              </span>
              <button
                onClick={logout}
                aria-label="Cerrar sesión"
                className="px-6 py-3 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => navigate('/grupo/0')}
                aria-label="Menú"
                className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                <span className="text-2xl">☰</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="page-container max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tus grupos</h1>
            <p className="text-gray-600 text-lg">
              Aquí están los grupos en los que participas
            </p>
          </div>
          <button
            onClick={() => setShowCreate((p) => !p)}
            className="btn-primary"
          >
            + Crear grupo nuevo
          </button>
        </div>

        {/* Form crear grupo */}
        {showCreate && (
          <div className="mb-10 card">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Crear un grupo nuevo</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 max-w-md">
              <label htmlFor="groupName" className="label-field">
                Nombre del grupo
              </label>
              <input
                id="groupName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ejemplo: Familia González"
                className="input-field"
              />
              <button
                type="submit"
                disabled={creating}
                className="btn-primary"
              >
                {creating ? 'Creando...' : 'Crear grupo'}
              </button>
            </form>
          </div>
        )}

        {success && (
          <div className="mb-8 p-5 rounded-2xl bg-green-50 border border-green-200 text-lg text-green-700 font-medium shadow-sm">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="mb-8 p-5 rounded-2xl bg-red-50 border border-red-200 text-lg text-red-700 font-medium shadow-sm">
            ❌ {error}
          </div>
        )}

        {/* Lista de grupos */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-gray-500 text-xl">
              Cargando tus grupos...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20 card">
              <div className="text-4xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No tienes grupos todavía
              </h2>
              <p className="text-gray-600 text-lg">
                Usa el botón de arriba para crear tu primer grupo.
              </p>
            </div>
          ) : (
            groups.map((g) => (
              <div
                key={g.id}
                className="card hover:shadow-md transition cursor-pointer group"
                onClick={() => navigate(`/grupo/${g.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/grupo/${g.id}`)}
                aria-label={`Grupo ${g.name}, código ${g.code}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                      {g.name}
                    </h3>
                    <p className="text-gray-600 text-lg mb-4">
                      Código: <span className="font-mono font-bold text-gray-800">{g.code}</span>
                    </p>
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                      g.assigned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {g.assigned ? '✅ Asignado' : '⏳ Pendiente'}
                    </div>
                  </div>
                  <span className="text-3xl">▶</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Unirse a grupo */}
        <div className="mt-16 card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Unirse a un grupo existente</h2>
          <p className="text-gray-600 text-lg mb-6">
            Pide el código al creador del grupo y escríbelo aquí:
          </p>
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-4 max-w-md">
            <div className="flex-1">
              <label htmlFor="joinCode" className="label-field">
                Código del grupo
              </label>
              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="input-field uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={joining}
              className="btn-primary"
            >
              {joining ? 'Uniendo...' : 'Unirse al grupo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
