const request = require('supertest');
const express = require('express');

// 1. Mock de la base de datos (Prisma)
jest.mock('../lib/prisma', () => ({
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
}));
const mockPrisma = require('../lib/prisma');

const movieRoutes = require('../routes/movieRoutes');

// 2. Mock de la autenticación configurado ANTES de inicializar Express
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

// App Express de prueba
const app = express();
app.use(express.json());
app.use('/api/movies', movieRoutes);

describe('PATCH /api/movies/:id/favorite', () => {
    
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe marcar una película como favorita correctamente (camino feliz)', async () => {
    // Simulamos que la película del usuario existe
    mockPrisma.movie.findFirst.mockResolvedValue({ 
      id: 'movie-1', 
      ownerId: 'user-123', 
      isFavorite: false 
    });

    // Simulamos que la base de datos devuelve el estado actualizado   
    mockPrisma.movie.update.mockResolvedValue({ 
      id: 'movie-1', 
      ownerId: 'user-123', 
      isFavorite: true 
    });

    const response = await request(app).patch('/api/movies/movie-1/favorite');

    expect(response.status).toBe(200);
    expect(response.body.isFavorite).toBe(true);
    expect(mockPrisma.movie.update).toHaveBeenCalledWith({
      where: { id: 'movie-1' },
      data: { isFavorite: true },
    });
  });

  it('Debe devolver 404 si la película no existe o no es del usuario', async () => {
    // Simulamos que no se encuentra la película
    mockPrisma.movie.findFirst.mockResolvedValue(null);

    const response = await request(app).patch('/api/movies/movie-fake/favorite');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Película no encontrada' });
    expect(mockPrisma.movie.update).not.toHaveBeenCalled(); // No debe intentar actualizar
  });

  it('Debe devolver 500 si hay un error en base de datos', async () => {
    mockPrisma.movie.findFirst.mockRejectedValue(new Error('DB Error'));

    const response = await request(app).patch('/api/movies/movie-1/favorite');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Error al actualizar el estado de favorito' });
  });
});
