import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { authSchema } from '../schemas/auth.schema';
import { validate } from '../middleware/validate';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

router.post('/register', validate(authSchema), async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = new UserModel({ email, passwordHash: password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', validate(authSchema), async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.cookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });

    res.json({ message: 'Logged in successfully' });
});

router.post('/refresh', (req: Request, res: Response) => {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const newAccessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });

        res.cookie('access_token', newAccessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.json({ message: 'Token refreshed' });
    } catch {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out' });
});

export default router;
