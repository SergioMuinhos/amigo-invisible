<h1 align="center">🎁 Amigo Invisible</h1>
<p align="center">
  <strong>Sorteo de amigo invisible para grupos, con autenticación Firebase, notificaciones discretas por email y listo para Docker + Portainer.</strong>
</p>

<p align="center">
  <a href="https://github.com/SergioMuinhos/amigo-invisible/actions"><img src="https://img.shields.io/github/actions/status/SergioMuinhos/amigo-invisible/main?label=CI&style=flat-square" alt="CI"></a>
  <a href="https://github.com/SergioMuinhos/amigo-invisible/blob/main/LICENSE"><img src="https://img.shields.io/github/license/SergioMuinhos/amigo-invisible?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/Docker-Multi--Stage-blue?style=flat-square&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Portainer-Stack-teal?style=flat-square&logo=portainer" alt="Portainer">
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React 18">
  <img src="https://img.shields.io/badge/Firebase-Auth-orange?style=flat-square&logo=firebase" alt="Firebase Auth">
  <img src="https://img.shields.io/badge/SQLite-Database-lightgrey?style=flat-square&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js" alt="Node.js Express">
</p>

---

## 📖 Sobre el proyecto

**Amigo Invisible** es una aplicación web moderna, accesible y completa pensada para organizar sorteos de amigo invisible entre familiares, amigos o compañeros de trabajo.

### ✨ Funcionalidades principales

- ✅ **Autenticación flexible:** Inicio de sesión con **Google** o con **correo y contraseña** (Firebase Auth).
- ✅ **Registro con Nombre y Apellidos:** Identificación clara de cada participante en los grupos, con prevención de correos duplicados.
- ✅ **Gestión completa de grupos:**
  - Crear grupos y generar códigos de invitación únicos.
  - Unirse a grupos existentes mediante código.
  - **Añadir participantes directamente** por nombre, apellidos y email (sin obligarles a registrarse previamente).
  - **Eliminar participantes** (exclusivo para el creador del grupo), con reinicio automático y seguro del sorteo si ya se hubiera realizado.
- ✅ **Sorteo aleatorio sin trampas:** Algoritmo que garantiza que a nadie le toque a sí mismo.
- ✅ **Notificaciones por email discretas y elegantes:**
  - Envío automático de correo a cada participante con su amigo asignado.
  - **Asunto discreto** (ej. *"Tu amigo invisible ya ha sido asignado 🎁"*) sin revelar el nombre en la vista previa del buzón para mantener la sorpresa.
  - Soporte de envío mediante **Gmail SMTP (SSL puerto 465)** y/o **Resend API**.
- ✅ **Consulta privada en la web:** Cada usuario puede consultar en todo momento a quién le ha tocado desde su panel.
- ✅ **100% Dockerizada y optimizada para Portainer:** Imagen multi-etapa con compilación nativa de SQLite, verificación de salud (`HEALTHCHECK`) y volumen persistente.

---

## ♿ Accesibilidad y diseño para todos

Esta aplicación ha sido diseñada con especial cuidado para que **cualquier persona**, independientemente de su edad o experiencia tecnológica, pueda utilizarla sin esfuerzo:

| Característica | Beneficio |
|---|---|
| 🔤 **Tipografía legible** | Fuente base generosa, clara y fácil de leer sin fatiga visual. |
| 🔘 **Botones amplios** | Áreas táctiles grandes (mínimo 50-60px), pensadas para móviles y pantallas táctiles. |
| 🎨 **Contraste visual óptimo** | Paleta de colores cuidada con alto contraste y estados visuales nítidos. |
| 🗣️ **Lenguaje directo** | Botones con textos explicativos acompañados de iconos comprensibles. |
| 🛡️ **Feedback interactivo** | Notificaciones claras (toasts) tras cada acción: sorteo, invitaciones, eliminaciones o avisos de configuración. |

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Autenticación** | Firebase Authentication (Google Identity Provider + Password) |
| **Backend** | Node.js, Express, Firebase Admin SDK |
| **Base de datos** | SQLite (`better-sqlite3`) persistida en volumen Docker |
| **Servicio de correo** | Nodemailer (Gmail SSL) + SDK oficial de Resend |
| **Despliegue** | Docker (Multi-stage build) y Portainer Stacks |

---

## 📁 Estructura del proyecto

```
amigo-invisible/
├── client/                     # Frontend (React 18 + Vite + Tailwind)
│   ├── src/
│   │   ├── api.js              # Cliente HTTP Axios centralizado
│   │   ├── firebaseConfig.js   # Inicialización de Firebase Web SDK
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Estado global de autenticación
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx   # Login y registro con validación
│   │   │   ├── Dashboard.jsx   # Panel de grupos y creación modal
│   │   │   └── GroupPage.jsx   # Gestión de miembros, sorteo y asignación
│   │   └── App.jsx
│   ├── .env.example
│   └── vite.config.js
├── server/                     # Backend (Node.js + Express)
│   ├── config/
│   ├── middleware/
│   │   └── auth.js             # Verificación de tokens Firebase Admin
│   ├── routes/
│   │   ├── auth.js             # Sincronización de perfiles
│   │   └── groups.js           # Lógica de grupos, sorteo y eliminación
│   ├── services/
│   │   └── mailer.js           # Servicio de email dual (Gmail SSL / Resend)
│   ├── db.js                   # Esquema y conexión SQLite
│   ├── server.js               # Servidor Express y health check
│   └── .env.example
├── Dockerfile                  # Build multi-etapa con dependencias nativas
├── docker-compose.yml          # Compose listo para Portainer Stacks
├── vars.env.example            # Plantilla completa de variables para Portainer
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 🐳 Despliegue con Portainer (Recomendado)

El proyecto está diseñado para desplegarse en cuestión de minutos usando **Portainer Stacks**:

### Pasos:

1. Entra en tu panel de **Portainer**.
2. Ve a **Stacks** > **Add stack**.
3. Asigna un nombre al stack (ejemplo: `amigo-invisible`).
4. Selecciona el método de compilación **Repository**:
   - **Repository URL:** `https://github.com/SergioMuinhos/amigo-invisible.git`
   - **Repository reference:** `refs/heads/main`
   - **Compose path:** `docker-compose.yml`
5. En la sección **Environment variables**, selecciona el modo avanzado o copia y pega el contenido de [vars.env.example](vars.env.example) con tus credenciales reales (ver apartado siguiente).
6. Haz clic en **Deploy the stack**.
7. ¡Listo! Accede a tu aplicación en `http://tu-servidor:3000`.

---

## ⚙️ Variables de entorno para Portainer

Puedes copiar y pegar este bloque directamente en el editor de variables de Portainer:

```env
# Puerto en el host (ej. 3000 u 80)
PORT=3000

# URL pública de tu aplicación (para enlaces generados en los correos)
APP_URL=http://tu-servidor:3000

# ------------------------------------------------------------------------------
# FRONTEND: Firebase Web App (Firebase Console > Configuración del Proyecto)
# ------------------------------------------------------------------------------
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_API_BASE=/api

# ------------------------------------------------------------------------------
# BACKEND: Firebase Admin SDK (Cuentas de servicio > Generar clave privada)
# ------------------------------------------------------------------------------
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_AQUI\n-----END PRIVATE KEY-----\n"

# ------------------------------------------------------------------------------
# ENVÍO DE CORREOS: Opción A - Gmail (Recomendado)
# Requiere cuenta Google con verificación en dos pasos y 'Contraseña de aplicación'
# ------------------------------------------------------------------------------
SMTP_SERVICE=gmail
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion_16_caracteres
SMTP_FROM=tu_correo@gmail.com

# ------------------------------------------------------------------------------
# ENVÍO DE CORREOS: Opción B - Resend API (Opcional como fallback o alternativa)
# ------------------------------------------------------------------------------
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
# EMAIL_FROM=Amigo Invisible <onboarding@resend.dev>
```

> 🔒 **Nota de seguridad:** Nunca subas tus archivos `.env` o `vars.env` con contraseñas a GitHub. Ya están incluidos en el `.gitignore`.

---

## 🔑 Obtención de credenciales

### 1. Firebase (Autenticación)
1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto.
2. En **Autenticación** > **Sign-in method**, activa **Google** y **Correo/Contraseña**.
3. En **Configuración del proyecto > General**, añade una aplicación Web (`</>`) y copia las claves para el frontend (`VITE_FIREBASE_*`).
4. En **Configuración del proyecto > Cuentas de servicio**, haz clic en **Generar nueva clave privada** para descargar el archivo JSON con las credenciales del backend (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).

### 2. Gmail SMTP (Para enviar los correos)
1. Inicia sesión en tu cuenta de Google y ve a [Seguridad de Google](https://myaccount.google.com/security).
2. Asegúrate de tener activada la **Verificación en 2 pasos**.
3. Busca **Contraseñas de aplicaciones**.
4. Genera una contraseña para "Amigo Invisible" (obtendrás un código de 16 letras, ej. `abcd efgh ijkl mnop`).
5. Configura `SMTP_USER=tu_correo@gmail.com` y `SMTP_PASS=abcdefghijklmnop`.

---

## 💻 Desarrollo local

Si prefieres ejecutar el proyecto en tu máquina sin Docker:

```bash
# 1. Clonar el repositorio
git clone https://github.com/SergioMuinhos/amigo-invisible.git
cd amigo-invisible

# 2. Configurar variables de entorno
cp client/.env.example client/.env
cp server/.env.example server/.env
# Rellena los archivos con tus credenciales

# 3. Instalar dependencias
cd server && npm install
cd ../client && npm install

# 4. Iniciar en desarrollo
# Terminal 1 (Backend):
cd server && npm run dev
# Terminal 2 (Frontend):
cd client && npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🗺️ Estado del proyecto & Roadmap

- [x] Autenticación con Google y Email/Contraseña.
- [x] Registro con nombre y apellidos y comprobación de correos duplicados.
- [x] Creación de grupos con código de invitación único.
- [x] Añadir participantes manualmente al grupo.
- [x] Eliminación de participantes exclusiva para el creador del grupo.
- [x] Sorteo aleatorio garantizado (nadie se autotoca).
- [x] Notificaciones por email elegantes y discretas (sin desvelar la asignación en el asunto).
- [x] Soporte dual de email: Gmail SMTP (SSL) + Resend API.
- [x] Contenedor Docker multi-stage optimizado con SQLite nativo y Healthcheck.
- [x] Soporte nativo para despliegue en Portainer Stacks.
- [ ] Exportación de resultados o lista de participantes a PDF/Excel.
- [ ] Listas de deseos / sugerencias de regalo por participante.

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).

---

<p align="center">
  Hecho con ❤️ por <a href="https://github.com/SergioMuinhos">SergioMuinhos</a>
</p>
