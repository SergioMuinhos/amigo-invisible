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
      setError(err.message || 'Error al iniciar sesión con Google');
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
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Escribe tu correo primero');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Se envió un enlace de restablecimiento a tu correo');
    } catch (err) {
      setError(err.message || 'Error al restablecer contraseña');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-10 lg:px-12 safe-bottom">
        <div className="w-full max-w-sm space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Amigo Invisible</h1>
            <p className="text-gray-600 text-sm">
              Inicia sesión para unirte a tu fiesta
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 mb-6 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm sm:text-base transition active:scale-95"
          >
            {googleLoading ? (
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Continuar con Google'}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <span className="relative flex justify-center px-3 text-xs sm:text-sm text-gray-500 bg-white">
              o continúa con correo
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm sm:text-base transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm sm:text-base transition"
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
              className="w-full py-4 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm sm:text-base rounded-xl disabled:opacity-60 transition active:scale-95"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-red-600 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Regístrate' : 'Ya tienes cuenta, inicia sesión'}
            </button>
          </p>
        </div>

        {error && (
          <div className="w-full max-w-sm p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
