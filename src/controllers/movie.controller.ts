import { Request, Response, NextFunction } from 'express';
import { movieStorage } from '../storage/movie';

export const getMovieById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const movie = await movieStorage.getById(req.params.id as string);

        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'movie not found',
            });
        }
        res.json(movie);
    } catch (error) {
        next(error);
    }
};

export const getAllMovies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = {
            genre: req.query.genre as string,
            director: req.query.director as string,
            actor: req.query.actor as string,
        };
        const movies = await movieStorage.getAll(filters);
        res.json(movies);
    } catch (error) {
        next(error);
    }
};
