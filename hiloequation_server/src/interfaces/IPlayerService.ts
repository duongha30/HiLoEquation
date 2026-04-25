export interface FindByEmailParams {
    email: string;
    select?: Record<string, number>;
}

export interface IPlayerService {
    findByEmail(params: FindByEmailParams): Promise<unknown>;
}
