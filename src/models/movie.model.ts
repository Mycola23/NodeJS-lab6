import { Schema, model, Document } from 'mongoose';

export interface IMovie {
    title: string;
    description?: string;
    genre:
        | 'Action'
        | 'Drama'
        | 'Comedy'
        | 'Sci-Fi'
        | 'Horror'
        | 'Documentary'
        | 'History'
        | 'Adventure'
        | 'Western'
        | 'Love'
        | 'Thriller'
        | 'Fantasy';
    rating: number;
    releaseYear: number;
    director: string;
    actors?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    isClassic?: boolean;
    ownerId: Schema.Types.ObjectId;
}

export interface MovieDocument extends IMovie, Document {}

const MovieSchema = new Schema<MovieDocument>(
    {
        title: {
            type: String,
            required: [true, 'Назва фільму є обов’язковою'],
            trim: true,
            minlength: [1, 'Назва не може бути порожньою'],
            maxlength: [250, 'Назва не може перевищувати 250 символів'],
        },
        description: {
            type: String,
            maxlength: [3500, 'Опис занадто довгий'],
            default: '',
        },
        genre: {
            type: String,
            required: [true, 'Жанр є обов’язковим'],
            enum: {
                values: [
                    'Action',
                    'Drama',
                    'Comedy',
                    'Sci-Fi',
                    'Horror',
                    'Documentary',
                    'History',
                    'Adventure',
                    'Western',
                    'Love',
                    'Thriller',
                    'Fantasy',
                ],
                message: '{VALUE} не є дозволеним жанром',
            },
        },
        rating: {
            type: Number,
            required: [true, 'Рейтинг є обов’язковим'],
            min: [0, 'Рейтинг не може бути менше 0'],
            max: [5, 'Рейтинг не може бути більше 5'],

            validate: {
                validator: function (v: number) {
                    return Number((v % 0.1).toFixed(10)) === 0 || Number((v % 0.1).toFixed(10)) === 0.1;
                },
                message: props => `${props.value} має бути кратним 0.1 (4.2, 3.5...)`,
            },
        },
        releaseYear: {
            type: Number,
            required: [true, 'Рік випуску є обов’язковим'],
            min: [1940, 'Ми не розглядаємо фільми старіші за 1940 рік'],
            validate: {
                validator: (v: number) => Number.isInteger(v) && v <= new Date().getFullYear(),
                message: 'Рік випуску не може бути в майбутньому',
            },
        },
        director: {
            type: String,
            required: [true, 'Режисер є обов’язковим'],
            minlength: 1,
            maxlength: 100,
        },
        actors: {
            type: [String],
            default: [],
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

MovieSchema.virtual('isClassic').get(function () {
    const currentYear = new Date().getFullYear();
    return currentYear - this.releaseYear >= 20;
});

export const MovieModel = model<MovieDocument>('Movie', MovieSchema);
