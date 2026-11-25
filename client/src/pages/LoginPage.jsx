import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión. Revisa tus datos');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Escribe primero tu correo electrónico');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Se envió un enlace para cambiar tu contraseña');
    } catch (err) {
      setError('No se pudo enviar el enlace');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen items-center justify-center py-12 sm:px-6 lg:px-8 safe-bottom">
        {/* Tarjeta centrada: en móvil ocupa casi todo el ancho, en desktop max-w-md */}
        <div className="w-full max-w-md space-y-8 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-200">
          <div className="text-center">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">🎁</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Amigo Invisible
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Inicia sesión para participar en tu grupo
            </p>
          </div>

          {/* Botón Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            aria-label="Iniciar sesión con tu cuenta de Google"
            className="w-full flex items-center justify-center gap-3 px-5 py-4 border border-gray-300 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-base sm:text-lg transition active:scale-[0.98] disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="text-lg">Cargando...</span>
            ) : (
              <>
                <span className="text-xl">🔍</span>
                <span>Iniciar con Google</span>
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <span className="relative flex justify-center px-3 text-sm sm:text-base text-gray-500 bg-white">
              o entra con tu correo
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="label-field">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="password" className="label-field">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>
            {mode === 'login' && (
              <p className="text-right text-sm text-red-600 cursor-pointer hover:underline" onClick={handleReset}>
                ¿Olvidaste tu contraseña?
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-base text-gray-600">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-red-600 font-bold underline hover:text-red-700"
            >
              {mode === 'login' ? 'Regístrate aquí' : 'Ya tienes cuenta, entra aquí'}
            </button>
          </p>
        </div>

        {error && (
          <div className="w-full max-w-md p-4 rounded-2xl bg-red-50 border border-red-200 text-base text-red-700 shadow-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
