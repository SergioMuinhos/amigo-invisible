require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');

require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'amigo-invisible' });
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

// Servir frontend en producción (build de Vite copiado a client/dist)
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Amigo Invisible escuchando en http://0.0.0.0:${PORT}`);
});
