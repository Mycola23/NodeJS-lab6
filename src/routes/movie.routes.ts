import { Router, Request, Response, NextFunction } from 'express';
import { movieStorage } from '../storage/movie';
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schema';
import { validate } from '../middleware/validate';
import { MovieModel } from '../models/movie.model';

const router = Router();
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { genre, director, actor, sort, page, limit } = req.query;
        const result = await movieStorage.getAll({
            genre: genre as string,
            director: director as string,
            actor: actor as string,
            sort: sort as string,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 10,
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/top-rated', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const movies = await MovieModel.find({ rating: { $gte: 4.5 } })
            .sort({ rating: -1 })
            .limit(5);
        res.json(movies);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const movie = await movieStorage.getById(req.params.id as string);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json(movie);
    } catch (error) {
        next(error);
    }
});

router.post('/', validate(createMovieSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newMovie = await movieStorage.create(req.body);
        res.status(201).json(newMovie);
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', validate(updateMovieSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updated = await movieStorage.update(id as string, req.body);

        if (!updated) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deleted = await movieStorage.delete(req.params.id as string);
        if (!deleted) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
