import Authenticator from './Authenticator'

const passport = new Authenticator()

// Workaround for importing fastify-passport in native ESM context
module.exports = exports = passport
export default passport
export { Strategy } from './strategies/base'
export { Authenticator } from './Authenticator'
export type {
  ExpressSessionData,
  FastifyPassportInitializePlugin,
  FastifyPassportInitializePluginDecorators,
  FastifyPassportReply,
  FastifyPassportReplyDecorators,
  FastifyPassportRequest,
  FastifyPassportRequestDecorators,
  PassportUser
} from './types'
