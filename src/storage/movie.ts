import { MovieModel } from '../models/movie.model';
import { CreateMovieInput } from '../schemas/movie.schema';

interface GetAllParams {
    genre?: string;
    director?: string;
    actor?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

class MovieStorage {
    async getAll(params: GetAllParams) {
        const { genre, director, actor, sort, page = 1, limit = 10 } = params;

        const query: any = {};

        if (genre) query.genre = genre;
        if (director) query.director = { $regex: director, $options: 'i' };
        if (actor) query.actors = { $regex: actor, $options: 'i' };

        let sortQuery: any = { createdAt: -1 };
        if (sort) {
            const isDesc = sort.startsWith('-');
            const field = isDesc ? sort.substring(1) : sort;
            sortQuery = { [field]: isDesc ? -1 : 1 };
        }

        const skip = (page - 1) * limit;

        const [data, totalItems] = await Promise.all([
            MovieModel.find(query).sort(sortQuery).skip(skip).limit(limit),
            MovieModel.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
            },
        };
    }
    async getById(id: string) {
        return await MovieModel.findById(id);
    }
    async create(data: CreateMovieInput) {
        const newMovie = new MovieModel(data);
        return await newMovie.save();
    }
    async update(id: string, data: Partial<CreateMovieInput>) {
        try {
            return await MovieModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        } catch (error) {
            return null;
        }
    }
    async delete(id: string) {
        try {
            const result = await MovieModel.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            return false;
        }
    }
    async clear() {
        await MovieModel.deleteMany({});
    }
}

export const movieStorage = new MovieStorage();
