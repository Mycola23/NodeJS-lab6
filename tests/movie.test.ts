import request from 'supertest';
import app from '../src/app';
import { connectTestDB, closeTestDB, clearCollections } from './setup';
import { MovieModel } from '../src/models/movie.model';
import { UserModel } from '../src/models/user.model';
import mongoose from 'mongoose';

describe('Movie Platform API & Model Tests', () => {
    let authCookie: string[];
    let testUserId: mongoose.Types.ObjectId;
    let validMovie: any;

    beforeAll(async () => {
        await connectTestDB();
    });

    beforeEach(async () => {
        const credentials = { email: 'movietester@example.com', password: 'password123' };
        await request(app).post('/auth/register').send(credentials);

        const loginRes = await request(app).post('/auth/login').send(credentials);
        authCookie = loginRes.get('Set-Cookie') as string[];

        const user = await UserModel.findOne({ email: credentials.email });
        testUserId = user!._id as mongoose.Types.ObjectId;

        validMovie = {
            title: 'Inception',
            genre: 'Sci-Fi',
            rating: 4.8,
            releaseYear: 2010,
            director: 'Christopher Nolan',
            actors: ['Leonardo DiCaprio'],
            ownerId: testUserId,
        };
    });
    afterAll(async () => await closeTestDB());
    afterEach(async () => await clearCollections());

    describe('Movie Model Unit Tests', () => {
        test('Має створювати createdAt та updatedAt автоматично', async () => {
            const movie = await MovieModel.create(validMovie);
            expect(movie.createdAt).toBeDefined();
            expect(movie.updatedAt).toBeDefined();
        });

        test('Віртуальне поле isClassic має працювати', async () => {
            const oldMovie = await MovieModel.create({ ...validMovie, releaseYear: 1990 });
            const newMovie = await MovieModel.create({ ...validMovie, releaseYear: 2023 });
            expect(oldMovie.isClassic).toBe(true);
            expect(newMovie.isClassic).toBe(false);
        });

        test('Кастомний валідатор: помилка, якщо рейтинг не кратний 0.1', async () => {
            const movie = new MovieModel({ ...validMovie, rating: 4.85 });
            let err: any;
            try {
                await movie.save();
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.errors.rating.message).toContain('має бути кратним 0.1');
        });
    });

    describe('Integration API Tests', () => {
        test('POST /api/movies - Успішне створення (201)', async () => {
            const res = await request(app).post('/api/movies').set('Cookie', authCookie).send(validMovie);
            expect(res.status).toBe(201);
            expect(res.body.title).toBe('Inception');
            expect(res.body.id).toBeDefined();
        });

        test('GET /api/movies - Перевірка формату пагінації (200)', async () => {
            await MovieModel.create(validMovie);
            const res = await request(app).get('/api/movies');

            expect(res.status).toBe(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBe(1);
            expect(res.body.pagination).toEqual({
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
            });
        });

        test('GET /api/movies/:id - Невалідний формат ID (400)', async () => {
            const res = await request(app).get('/api/movies/not-a-valid-id');
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Invalid format');
        });

        test('GET /api/movies/:id - Валідний ID, але фільм не знайдено (404)', async () => {
            const fakeId = new (require('mongoose').Types.ObjectId)();
            const res = await request(app).get(`/api/movies/${fakeId}`);
            expect(res.status).toBe(404);
        });

        test('PATCH /api/movies/:id - Успішне оновлення', async () => {
            const movie = await MovieModel.create(validMovie);
            const res = await request(app).patch(`/api/movies/${movie._id}`).set('Cookie', authCookie).send({ rating: 4.9 });

            expect(res.status).toBe(200);
            expect(res.body.rating).toBe(4.9);
        });

        test('GET /api/movies/top-rated - Фільтрація в БД', async () => {
            await MovieModel.create(validMovie); // 4.8
            await MovieModel.create({ ...validMovie, title: 'Bad', rating: 2.0 });

            const res = await request(app).get('/api/movies/top-rated');
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Inception');
        });

        test('Сортування: ?sort=-releaseYear', async () => {
            await MovieModel.create({ ...validMovie, title: 'Old', releaseYear: 2000 });
            await MovieModel.create({ ...validMovie, title: 'New', releaseYear: 2024 });

            const res = await request(app).get('/api/movies?sort=-releaseYear');
            expect(res.body.data[0].title).toBe('New');
            expect(res.body.data[1].title).toBe('Old');
        });
    });
});
