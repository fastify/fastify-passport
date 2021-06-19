declare class AuthenticationError extends Error {
    status: number;
    constructor(message: string, status: number);
}
export default AuthenticationError;
