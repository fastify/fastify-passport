class AuthenticationError extends Error {
  status: number

  constructor(message: string, status: number) {
    super()

    Error.captureStackTrace(this, this.constructor)
    this.name = 'AuthenticationError'
    this.message = message
    this.status = status || 401
  }
}

export default AuthenticationError
