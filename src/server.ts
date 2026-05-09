import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/database';
import app from './app';
import { Request, Response } from 'express';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('api works,db connected');
});

const start = async () => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            console.log(`server start on port ${PORT}`);
        });
        const shutdown = async (signal: string) => {
            console.log(`get signal ${signal}. close server`);
            await mongoose.connection.close();
            console.log('connect with mongodb closed');

            server.close(() => {
                console.log('server stopp');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        console.error('error during start:', error);
        process.exit(1);
    }
};
start();
