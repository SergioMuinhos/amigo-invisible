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
  const [menuOpen, setMenuOpen] = useState(false);
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
      setSuccess('Grupo creado correctamente');
      await loadGroups();
    } catch (err) {
      setError(err.message || 'Error al crear grupo');
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
      setError(err.message || 'Error al unirse al grupo');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <span className="font-bold text-xl text-gray-800 tracking-tight">
                Amigo Invisible
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Menú móvil */}
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

        {/* Dropdown móvil */}
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
              onClick={logout}
              className="w-full py-3 px-4 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 safe-bottom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Tus grupos</h1>
          <button
            onClick={() => setShowCreate((p) => !p)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm sm:text-base transition active:scale-95"
          >
            + Crear grupo
          </button>
        </div>

        {/* Form crear grupo (inline) */}
        {showCreate && (
          <div className="mb-6 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del grupo"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm sm:text-base transition"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm sm:text-base disabled:opacity-60 transition active:scale-95"
              >
                Crear
              </button>
            </form>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 sm:p-4 rounded-xl bg-green-50 border border-green-200 text-sm sm:text-base text-green-700 shadow-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-sm sm:text-base text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Lista de grupos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-gray-500">
              Cargando grupos...
            </div>
          ) : groups.length === 0 ? (
            <div className="col-span-3 text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.127-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-6c0-.71.055-1.416.198-2.087M7 20v-2.58c0-.516-.076-1.015-.198-1.584M12 20v-6c0-.71.055-1.416.198-2.087M12 20v-2.58c0-.516-.076-1.015-.198-1.584M3 16l3-.001M3 16l.001-.001.001-.001L3 15" />
                </svg>
              </div>
              <p className="text-gray-500">No estás en ningún grupo todavía.</p>
            </div>
          ) : (
            groups.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-md transition"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-1 sm:text-xl">{g.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Código: <span className="font-mono font-semibold text-gray-700">{g.code}</span>
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm mb-4">
                  <span className={`px-2.5 py-1 rounded-full ${
                    g.assigned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {g.assigned ? 'Asignado' : 'Pendiente'}
                  </span>
                </div>
                <Link
                  to={`/grupo/${g.id}`}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-center transition active:scale-95"
                >
                  Ver grupo
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Unirse a grupo */}
        <div className="mt-10 sm:mt-12 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 sm:text-xl">Unirse a un grupo</h2>
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3 max-w-sm">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código del grupo"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm sm:text-base transition"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm sm:text-base disabled:opacity-60 transition active:scale-95"
            >
              Unirse
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
