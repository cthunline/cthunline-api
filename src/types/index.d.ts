declare namespace Express {
    interface Request {
        user: UserSelect;
    }
    interface Response {
        error: (err: Error) => void
    }
}
