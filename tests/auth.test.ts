import request from 'supertest';
import app from '../src/app';
import { UserModel } from '../src/models/user.model';
import { connectTestDB, closeTestDB, clearCollections } from './setup';

describe('Auth System Integration Tests', () => {
    beforeAll(async () => await connectTestDB());
    afterAll(async () => await closeTestDB());
    afterEach(async () => await clearCollections());

    const userCredentials = { email: 'test@example.com', password: 'password123' };

    describe('POST /auth/register', () => {
        test('Успішна реєстрація (201)', async () => {
            const res = await request(app).post('/auth/register').send(userCredentials);

            expect(res.status).toBe(201);
            expect(res.body.passwordHash).toBeUndefined();
            const user = await UserModel.findOne({ email: userCredentials.email });
            expect(user).toBeDefined();
            expect(user?.passwordHash).not.toBe(userCredentials.password);
        });

        test('Помилка 409 при реєстрації дубліката пошти', async () => {
            await request(app).post('/auth/register').send(userCredentials);
            const res = await request(app).post('/auth/register').send(userCredentials);

            expect(res.status).toBe(409);
            expect(res.body.message).toContain('already in use');
        });

        test('Помилка валідації (400) при некоректних даних', async () => {
            const res = await request(app).post('/auth/register').send({
                email: 'not-an-email',
                password: '123',
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Validation failed');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/auth/register').send(userCredentials);
        });

        test('Успішний логін - видача двох cookies (200)', async () => {
            const res = await request(app).post('/auth/login').send(userCredentials);

            expect(res.status).toBe(200);
            const cookies = res.get('Set-Cookie');

            expect(cookies.some(c => c.includes('access_token'))).toBe(true);
            expect(cookies.some(c => c.includes('refresh_token'))).toBe(true);
            expect(cookies[0]).toContain('HttpOnly');
        });

        test('Помилка 401 при невірному паролі', async () => {
            const res = await request(app).post('/auth/login').send({
                email: userCredentials.email,
                password: 'wrongpassword',
            });

            expect(res.status).toBe(401);
        });

        test('Помилка 401 для неіснуючого користувача', async () => {
            const res = await request(app).post('/auth/login').send({
                email: 'nobody@example.com',
                password: 'password123',
            });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /auth/refresh & /auth/logout', () => {
        let refreshCookie: string;

        beforeEach(async () => {
            await request(app).post('/auth/register').send(userCredentials);
            const loginRes = await request(app).post('/auth/login').send(userCredentials);
            refreshCookie = loginRes.get('Set-Cookie').find(c => c.startsWith('refresh_token'))!;
        });

        test('Оновлення токенів через /auth/refresh', async () => {
            const res = await request(app).post('/auth/refresh').set('Cookie', [refreshCookie]);

            expect(res.status).toBe(200);
            expect(res.get('Set-Cookie').some(c => c.includes('access_token'))).toBe(true);
        });

        test('Вихід із системи /auth/logout - очищення cookies', async () => {
            const res = await request(app).post('/auth/logout');

            expect(res.status).toBe(200);
            const cookies = res.get('Set-Cookie');
            expect(cookies[0]).toMatch(/access_token=;|(Max-Age=0)/);
        });
    });
});
