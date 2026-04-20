export type FetchUserResponse = {
    status: string;
    message: string;
    metadata: {
        user: {
            _id: string;
            name: string;
            email: string;
        };
    };
};

export type SignupPayload = {
    username: string;
    email: string;
    password: string;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type UserMetadata = {
    user: {
        _id: string;
        name: string;
        email: string;
    };
};