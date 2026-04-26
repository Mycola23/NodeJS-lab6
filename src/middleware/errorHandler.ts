import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.issues,
        });
    }

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            status: 'error',
            message: `Invalid format for field ${err.path}: ${err.value}. Expected a valid ObjectId.`,
        });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(err.errors).map((val: any) => val.message);
        return res.status(400).json({
            status: 'error',
            message: 'Database validation failed',
            errors: messages,
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            status: 'error',
            message: `Duplicate field value entered: ${field}. Please use another value.`,
        });
    }

    if (err.name === 'DocumentNotFoundError') {
        return res.status(404).json({
            status: 'error',
            message: 'Resource not found in database',
        });
    }

    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
};
