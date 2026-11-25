<h1 align="center">🎁 Amigo Invisible</h1>
<p align="center">
  <strong>Sorteo de amigo invisible para grupos, con autenticación Firebase y listo para Docker + Portainer.</strong>
</p>

<p align="center">
  <a href="https://github.com/SergioMuinhos/amigo-invisible/actions"><img src="https://img.shields.io/github/actions/status/SergioMuinhos/amigo-invisible/main?label=CI&style=flat-square" alt="CI"></a>
  <a href="https://github.com/SergioMuinhos/amigo-invisible/blob/main/LICENSE"><img src="https://img.shields.io/github/license/SergioMuinhos/amigo-invisible?style=flat-square" alt="License"></a>
  <a href="https://hub.docker.com/r/sergiomuinhos/amigo-invisible"><img src="https://img.shields.io/docker/v/sergiomuinhos/amigo-invisible?style=flat-square" alt="Docker"></a>
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React 18">
  <img src="https://img.shields.io/badge/Firebase-Auth-orange?style=flat-square&logo=firebase" alt="Firebase Auth">
  <img src="https://img.shields.io/badge/SQLite-Database-lightgrey?style=flat-square&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js" alt="Node.js Express">
</p>

---

## 📖 Sobre el proyecto

**Amigo Invisible** es una aplicación web pensada para hacer sorteos de amigo invisible entre amigos, familia o compañeros de trabajo. Cada usuario puede:

- ✅ Iniciar sesión con **Google** o **usuario/contraseña** (Firebase Auth)
- ✅ **Crear un grupo** (fiesta) y obtener un código único de invitación
- ✅ **Unirse a un grupo** usando el código del creador
- ✅ **Ver quiénes son los miembros** del grupo
- ✅ **Asignar aleatoriamente** el amigo invisible (solo el creador)
- ✅ **Consultar en privado** a quién le tocó (nadie más lo ve)

Está diseñado para correr en un **contenedor Docker** y desplegarse fácilmente con **Portainer** en tu propio servidor.

---

## ♿ Accesibilidad para personas mayores

Esta aplicación está diseñada pensando en que **cualquier persona**, sin importar su edad o experiencia con la tecnología, pueda usarla sin dificultad.

### Características de accesibilidad

| Característica | Beneficio |
|--------------|-----------|
| 🔤 **Texto grande** | Tamaño de fuente base de 18px, fácil de leer sin gafas |
| 🔘 **Botones enormes** | Mínimo 60px de alto, fáciles de tocar con precisión |
| 🎨 **Contraste alto** | Colores claros y nítidos para buena visibilidad |
| ⌨️ **Navegación por teclado** | Indicador de foco muy visible (rojo intenso) |
| 📱 **Pantallas táctiles** | Espaciado generoso entre elementos para evitar toques accidentales |
| 🔇 **Sin movimiento innecesario** | Respeta la preferencia de "reducir movimiento" del sistema |
| 🗣️ **Lenguaje sencillo** | Botones y mensajes con texto claro, sin iconos crípticos solos |
| ♿ **Lectores de pantalla** | Etiquetas ARIA en todos los botones y campos |

### Principios de diseño

- **Un solo objetivo por pantalla:** Cada vista tiene una acción principal clara.
- **Texto descriptivo:** Los botones dicen exactamente qué hacen (ej. "Crear grupo", no solo "+").
- **Feedback inmediato:** Mensajes de éxito y error con iconos (✅ / ❌) y colores claros.
- **Nunca solo iconos:** Los botones siempre tienen texto acompañante.
- **Volver atrás evidente:** Botón de "Volver" visible en todas las pantallas internas.

## 📱 Capturas

> Puedes añadir capturas de pantalla aquí.  
> Ejemplo:
> - `docs/login.png` – Pantalla de inicio de sesión
> - `docs/dashboard.png` – Lista de grupos
> - `docs/grupo.png` – Detalle del grupo y asignación

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Autenticación** | Firebase Auth (Google + Email/Password) |
| **Backend** | Node.js + Express |
| **Base de datos** | SQLite (archivo único, volumen persistente) |
| **Despliegue** | Docker + Portainer |

---

## 📁 Estructura del proyecto

```
amigo-invisible/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── firebaseConfig.js
│   │   ├── api.js
│   │   ├── context/AuthContext.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── Dashboard.jsx
│   │       └── GroupPage.jsx
│   ├── .env.example
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                 # Backend (Node.js + Express)
│   ├── server.js
│   ├── db.js
│   ├── middleware/auth.js
│   │   ├── routes/auth.js
│   │   └── routes/groups.js
│   ├── .env.example
│   └── package.json
├── Dockerfile              # Imagen Docker multi-etapa
├── docker-compose.yml      # Listo para Portainer
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 🚀 Inicio rápido (desarrollo local)

### 1. Clona el repositorio

```bash
git clone https://github.com/SergioMuinhos/amigo-invisible.git
cd amigo-invisible
```

### 2. Configura Firebase

Crea un proyecto en [Firebase Console](https://console.firebase.google.com) y habilita:
- **Authentication > Sign-in method:** Google y Email/Password

Copia los archivos de ejemplo y rellénalos:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Edita `client/.env` con los datos de tu aplicación web de Firebase.

### 3. Instala dependencias

```bash
# Backend
cd server
npm install

# Frontend (nueva terminal)
cd ../client
npm install
```

### 4. Ejecuta en desarrollo

```bash
# Terminal 1 - Backend (puerto 3001)
cd server
npm run dev

# Terminal 2 - Frontend (puerto 5173)
cd client
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

---

## 🐳 Despliegue con Docker + Portainer

### Opción A: Desplegar desde GitHub en Portainer

1. Entra a tu Portainer.
2. Ve a **Stacks** > **Add stack**.
3. Nombra el stack: `amigo-invisible`.
4. Elige **Git** como origen:
   - **Repository URL:** `https://github.com/SergioMuinhos/amigo-invisible.git`
   - **Branch:** `main`
   - **Compose file path:** `docker-compose.yml`
5. Añade las variables de entorno (ver tabla abajo).
6. Haz clic en **Deploy the stack**.

### Opción B: Desplegar manualmente con docker-compose

```bash
git clone https://github.com/SergioMuinhos/amigo-invisible.git
cd amigo-invisible

# Configura variables de entorno
cp server/.env.example server/.env
# Edita server/.env con tus claves de Firebase

docker-compose up -d
```

La aplicación estará disponible en `http://tu-servidor:3000`.

---

## ⚙️ Variables de entorno

### Backend (`server/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del contenedor | `3000` |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | `mi-proyecto-123` |
| `FIREBASE_CLIENT_EMAIL` | Email de la Service Account | `firebase-adminsdk-xxx@proyecto.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Clave privada (con `\n`) | `-----BEGIN PRIVATE KEY-----...` |
| `DB_PATH` | Ruta de la base de datos SQLite | `/data/database.sqlite` |

### Frontend (`client/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | API Key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente |
| `VITE_FIREBASE_APP_ID` | ID de la app |
| `VITE_API_BASE` | URL base de la API (`/api` en Docker) |

> 🔒 **Nunca subas los archivos `.env` a GitHub.** Están incluidos en `.gitignore`.

---

## 🔑 Configurar Firebase Service Account (para el backend)

1. Ve a [Firebase Console](https://console.firebase.google.com) > tu proyecto.
2. **Configuración del proyecto** > **Cuentas de servicio**.
3. Haz clic en **Generar nueva clave privada**.
4. Descarga el archivo JSON.
5. Copia los valores en `server/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (incluye los saltos de línea `\n`)

---

## 📋 Variables de entorno (copiar y pegar)

Crea los archivos `.env` en tu computadora, pega estos bloques y modifica los valores con tus datos de Firebase.

### 📁 `server/.env`

```env
# Puerto del servidor (cambia si el 3000 está ocupado)
PORT=3000

# Ruta de la base de datos SQLite
DB_PATH=/data/database.sqlite

# ========================
# Firebase Admin SDK (Backend)
# Obtén estos valores en: Firebase Console > Configuración del proyecto > Cuentas de servicio
# ========================
FIREBASE_PROJECT_ID=TU_PROYECTO_ID
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@TU_PROYECTO.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUÍ\n-----END PRIVATE KEY-----\n"
```

### 📁 `client/.env`

```env
# ========================
# Firebase Web App (Frontend)
# Obtén estos valores en: Firebase Console > Configuración del proyecto > General > Tus aplicaciones > Web </>
# ========================
VITE_FIREBASE_API_KEY=TU_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=TU_PROYECTO.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=TU_PROYECTO_ID
VITE_FIREBASE_STORAGE_BUCKET=TU_PROYECTO.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=TU_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=1:TU_MESSAGING_SENDER_ID:web:TU_APP_ID

# URL de la API (en Docker usa /api porque el mismo contenedor sirve frontend y backend)
VITE_API_BASE=/api
```

### ⚠️ Important

- **No subas estos archivos a GitHub.** Ya están en el `.gitignore`.
- Configura los mismos valores en **Portainer > Stacks > amigo-invisible > Environment variables**.
- La `FIREBASE_PRIVATE_KEY` debe incluir los saltos de línea `\n` tal como aparecen en el archivo JSON que descargas de Firebase.
- Si cambias el `PORT`, recuerda actualizar también el `docker-compose.yml` y el puerto que exposes en Portainer.

---

## 📌 Cómo usar la aplicación

1. Regístrate o inicia sesión con Google o email/contraseña.
2. Crea un grupo y anota el **código de invitación**.
3. Comparte el código con tus amigos para que se unan.
4. Cuando todos estén dentro, el **creador** pulsa "Hacer asignación aleatoria".
5. Cada miembro entra al grupo y ve en privado **a quién le tocó**. 🎁

---

## 🗺️ Roadmap

- [ ] Notificaciones por email cuando se hace la asignación
- [ ] Editar y eliminar grupos
- [ ] Historial de sorteos anteriores
- [ ] Tema oscuro
- [ ] Soporte para múltiples idiomas (i18n)
- [ ] Imagen de perfil personalizable

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Si quieres mejorar el proyecto:

1. Haz un **fork** del repositorio.
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz tus cambios y commit: `git commit -m "feat: descripción"`
4. Sube tu rama: `git push origin feature/nueva-funcionalidad`
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.

---

## ✉️ Contacto

Hecho por [SergioMuinhos](https://github.com/SergioMuinhos).  
Si tienes dudas o sugerencias, abre un [issue](https://github.com/SergioMuinhos/amigo-invisible/issues) en GitHub.

---

<p align="center">
  <b>¡Feliz sorteo de amigo invisible! 🎄🎁</b>
</p>
