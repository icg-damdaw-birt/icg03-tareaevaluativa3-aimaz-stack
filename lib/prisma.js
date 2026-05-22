// Configuración centralizada de Prisma para Prisma 7
// Este archivo exporta una instancia única del cliente de Prisma

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

let prisma;

// Si la URL empieza por postgres (estamos en Render / producción)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  // Inicializamos Prisma de forma limpia (nativo para PostgreSQL)
  prisma = new PrismaClient();
} else {
  // Si no, estamos en local usando SQLite
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./dev.db'
  });
  prisma = new PrismaClient({ adapter });
}

module.exports = prisma;
