import { Router, Request, Response, NextFunction } from 'express';
import { movieStorage } from '../storage/movie';
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schema';
import { validate } from '../middleware/validate';
import { MovieModel } from '../models/movie.model';
import { requireAuth } from '../middleware/auth.middleware';

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

router.post('/', requireAuth, validate(createMovieSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newMovie = await movieStorage.create({ ...req.body, ownerId: req.userId });
        res.status(201).json(newMovie);
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', requireAuth, validate(updateMovieSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const movie = await MovieModel.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Not found' });

        if (movie.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner' });
        }

        const updated = await movieStorage.update(req.params.id as string, req.body);
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const movie = await MovieModel.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Not found' });

        if (movie.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner' });
        }

        await movieStorage.delete(req.params.id as string);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
