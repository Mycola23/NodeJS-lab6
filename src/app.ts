import express from 'express';
import cors from 'cors';
import movieRoutes from './routes/movie.routes';
import { errorHandler } from './middleware/errorHandler';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import { Request, Response } from 'express';
const app = express();

app.get('/health', (req: Request, res: Response) => {
    // 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
        res.status(200).json({
            status: 'UP',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } else {
        res.status(503).json({
            status: 'DOWN',
            database: 'disconnected',
        });
    }
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/api/movies', movieRoutes);

app.use(errorHandler);
export default app;
