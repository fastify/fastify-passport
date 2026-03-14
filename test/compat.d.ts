import type {
  FastifyPassportReplyDecorators,
  FastifyPassportRequestDecorators
} from '../src/types'

declare module 'fastify/types/request' {
  interface BaseFastifyRequest {
    session: FastifyPassportRequestDecorators['session']
    user?: FastifyPassportRequestDecorators['user']
    account?: FastifyPassportRequestDecorators['account']
    authInfo?: FastifyPassportRequestDecorators['authInfo']
    passport: FastifyPassportRequestDecorators['passport']
    logIn: FastifyPassportRequestDecorators['logIn']
    login: FastifyPassportRequestDecorators['login']
    logOut: FastifyPassportRequestDecorators['logOut']
    logout: FastifyPassportRequestDecorators['logout']
    isAuthenticated: FastifyPassportRequestDecorators['isAuthenticated']
    isUnauthenticated: FastifyPassportRequestDecorators['isUnauthenticated']
    flash: FastifyPassportRequestDecorators['flash']
  }
}

declare module 'fastify/types/reply' {
  interface BaseFastifyReply {
    flash: FastifyPassportReplyDecorators['flash']
    generateCsrf: () => string
  }
}
