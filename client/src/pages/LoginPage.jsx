import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { api } from '../api';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('join');

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      localStorage.setItem('pendingJoinCode', inviteCode.trim().toUpperCase());
    }
  }, [inviteCode]);

  const handlePostAuth = async (token) => {
    const pendingCode = localStorage.getItem('pendingJoinCode') || inviteCode;
    if (pendingCode) {
      try {
        const res = await api.joinGroup(token, pendingCode.trim().toUpperCase());
        localStorage.removeItem('pendingJoinCode');
        if (res?.group?.id) {
          navigate(`/grupo/${res.group.id}`);
          return;
        }
      } catch (err) {
        console.warn('Auto join grupo:', err.message);
        localStorage.removeItem('pendingJoinCode');
      }
    }
    navigate('/dashboard');
  };

  const handleGoogle = async () => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const token = await res.user.getIdToken();
      await api.verifyAuth(token, { displayName: res.user.displayName });
      await handlePostAuth(token);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Ya existe una cuenta con este correo utilizando otro método de acceso.');
      } else {
        setError(err.message || 'No se pudo iniciar sesión con Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Por favor, introduce tu nombre y apellido.');
        return;
      }

      setLoading(true);
      try {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCredential.user, { displayName: fullName });
        const token = await userCredential.user.getIdToken();
        await api.verifyAuth(token, {
          displayName: fullName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        await handlePostAuth(token);
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
          setError('Este correo electrónico ya está registrado. Por favor, inicia sesión con tu contraseña.');
        } else if (err.code === 'auth/weak-password') {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else {
          setError(err.message || 'No se pudo crear la cuenta.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const token = await userCredential.user.getIdToken();
        await api.verifyAuth(token);
        await handlePostAuth(token);
      } catch (err) {
        console.error(err);
        if (
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/invalid-credential'
        ) {
          setError('Correo electrónico o contraseña incorrectos.');
        } else {
          setError(err.message || 'No se pudo iniciar sesión.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Escribe primero tu correo electrónico para enviarte las instrucciones.');
      return;
    }
    setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('Se envió un enlace para cambiar tu contraseña a tu correo.');
    } catch (err) {
      setError('No se pudo enviar el enlace de recuperación.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-6 shadow-sm z-10" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800">
          {/* Logo y Encabezado */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-red-600 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-md shadow-red-200 dark:shadow-none text-2xl font-bold">
              🎁
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Amigo Invisible
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
              {mode === 'login'
                ? 'Inicia sesión para entrar a tus grupos'
                : 'Crea tu cuenta con tu nombre y apellido'}
            </p>
          </div>

          {inviteCode && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-center animate-fade-in shadow-sm">
              <span className="text-2xl block mb-1">🎟️</span>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 mb-0.5">
                Invitación a grupo
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                ¡Has sido invitado con el código{' '}
                <span className="font-mono text-red-600 dark:text-red-400 font-extrabold">{inviteCode}</span>!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inicia sesión o regístrate para unirte automáticamente.
              </p>
            </div>
          )}

          {/* Botón Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            aria-label="Acceder con Google"
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-sm sm:text-base transition duration-150 shadow-sm active:scale-[0.99] disabled:opacity-50 mb-6"
          >
            {googleLoading ? (
              <span>Conectando con Google...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Acceder con Google</span>
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
            </div>
            <span className="relative flex justify-center text-xs uppercase tracking-wider text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 font-semibold">
              o con tu correo
            </span>
          </div>

          {/* Alertas con roles de accesibilidad modernos */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2"
            >
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="label-field">
                    Nombre
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej: Juan"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="label-field">
                    Apellido(s)
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej: García"
                    className="input-field"
                  />
                </div>
              </div>
            )}

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
                placeholder="nombre@ejemplo.com"
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading
                ? 'Procesando...'
                : mode === 'login'
                ? 'Iniciar sesión'
                : 'Registrarme con Nombre y Apellido'}
            </button>
          </form>

          {/* Cambio de modo */}
          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {mode === 'login' ? (
              <p>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-red-600 font-bold hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-red-600 font-bold hover:underline"
                >
                  Inicia sesión aquí
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
