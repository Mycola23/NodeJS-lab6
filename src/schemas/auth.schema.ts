import { z } from 'zod';

export const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Пароль має бути не менше 6 символів'),
});

export type AuthInput = z.infer<typeof authSchema>;
