// Configuración centralizada de Prisma para Prisma 7
// Este archivo exporta una instancia única del cliente de Prisma

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

let prisma;

// Si estamos en Render utilizando PostgreSQL
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  
  // Borramos temporalmente la directiva del motor en ejecución para que use el nativo de Postgres
  delete process.env.PRISMA_CLIENT_ENGINE_TYPE; 
  
  // Inicializamos pasándole directamente la URL de conexión de Neon
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

} else {
  // Si estamos en desarrollo local con SQLite
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./dev.db'
  });
  prisma = new PrismaClient({ adapter });
}

module.exports = prisma;
