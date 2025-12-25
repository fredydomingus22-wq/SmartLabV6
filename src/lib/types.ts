export type ActionState<T = void> = {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>; // Field-level validation errors
    data?: T; // Optional payload on success
};
