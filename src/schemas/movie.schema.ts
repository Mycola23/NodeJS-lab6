import { z } from 'zod';

export const createMovieSchema = z.object({
    title: z.string().min(1).max(250),
    description: z.string().max(3500).optional(),
    genre: z.enum(['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Documentary', 'History', 'Adventure', 'Western', 'Love', 'Thriller', 'Fantasy']),
    rating: z.number().min(0).max(5).multipleOf(0.1),
    releaseYear: z.number().int().min(1940).max(new Date().getFullYear()),
    director: z.string().min(1).max(100),
    actors: z.array(z.string().min(1).max(250)).optional(),
});

export const updateMovieSchema = createMovieSchema.partial();

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type Movie = CreateMovieInput & {
    id: string;
    createdAt: string;
    updatedAt: string;
};
