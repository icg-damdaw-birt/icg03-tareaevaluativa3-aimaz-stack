const request = require('supertest');
const express = require('express');

// 1. Mock de la base de datos (Prisma)
jest.mock('../lib/prisma', () => ({
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
  }
}));
const mockPrisma = require('../lib/prisma');

// 2. Mock de la autenticación configurado ANTES de inicializar Express
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const movieRoutes = require('../routes/movieRoutes');

// App Express de prueba local para aislar rutas
const app = express();
app.use(express.json());
app.use('/api/movies', movieRoutes);


describe('API de Rating', () => {
    
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/movies/:id/rating', () => {
      
    it('Debe actualizar el rating de una película correctamente (camino feliz)', async () => {
      // Configuramos mock para encontrar la película
      mockPrisma.movie.findFirst.mockResolvedValue({ 
        id: 'movie-1', 
        ownerId: 'user-123', 
        rating: 0 
      });

      // Configuramos mock para guardar la película devuelta
      mockPrisma.movie.update.mockResolvedValue({ 
        id: 'movie-1', 
        ownerId: 'user-123', 
        rating: 4 
      });

      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({ rating: 4 });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(4);
      
      expect(mockPrisma.movie.findFirst).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' }
      });
      expect(mockPrisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { rating: 4 },
      });
    });

    it('Debe devolver 400 si el rating es mayor que 5', async () => {
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({ rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'El rating debe ser un número entero entre 0 y 5' });
      expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled(); // Validar ANTES de consultar base de datos
      expect(mockPrisma.movie.update).not.toHaveBeenCalled();
    });

    it('Debe devolver 400 si el rating es menor que 0', async () => {
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({ rating: -1 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'El rating debe ser un número entero entre 0 y 5' });
      expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.movie.update).not.toHaveBeenCalled();
    });

    it('Debe devolver 400 si el rating no es entero (ej. texto)', async () => {
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({ rating: 'tres' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'El rating debe ser un número entero entre 0 y 5' });
      expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.movie.update).not.toHaveBeenCalled();
    });

    it('Debe devolver 400 si no se envía body (undefined)', async () => {
      const response = await request(app).patch('/api/movies/movie-1/rating');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'El rating debe ser un número entero entre 0 y 5' });
      expect(mockPrisma.movie.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.movie.update).not.toHaveBeenCalled();
    });
    
    it('Debe devolver 404 si la película no existe o no es del usuario', async () => {
      mockPrisma.movie.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/movies/movie-fake/rating')
        .send({ rating: 3 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Película no encontrada' });
      
      expect(mockPrisma.movie.findFirst).toHaveBeenCalled();
      expect(mockPrisma.movie.update).not.toHaveBeenCalled(); // No debe guardar nada
    });

  });
});
