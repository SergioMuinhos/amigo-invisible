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
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-10 lg:px-12 safe-bottom">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">🎁</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Amigo Invisible</h1>
            <p className="text-gray-600 text-lg">
              Inicia sesión para participar en tu grupo
            </p>
          </div>

          {/* Botón Google muy grande */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            aria-label="Iniciar sesión con tu cuenta de Google"
            className="w-full flex items-center justify-center gap-4 px-6 py-5 border border-gray-300 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-lg sm:text-xl transition active:scale-[0.98] disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="text-lg">Cargando...</span>
            ) : (
              <>
                <span className="text-2xl">🔍</span>
                <span>Iniciar con Google</span>
              </>
            )}
          </button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <span className="relative flex justify-center px-4 text-base text-gray-500 bg-white">
              o entra con tu correo
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
