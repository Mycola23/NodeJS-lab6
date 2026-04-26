import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('MONGODB_URI не визначено .env ');
        process.exit(1);
    }

    mongoose.connection.on('error', err => {
        console.error(`MongoDB помилка: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB відключено');
    });

    try {
        await mongoose.connect(uri);
        console.log('Успішно підключено MongoDB ');
    } catch (error) {
        console.error('Не вдалося підключитися до MongoDB:', error);
        process.exit(1);
    }
};
