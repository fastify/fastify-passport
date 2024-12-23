import { Authenticator } from './Authenticator';
import './type-extensions'; // necessary to make sure that the fastify types are augmented
const passport = new Authenticator();

// Workaround for importing fastify-passport in native ESM context
module.exports = exports = passport;
export default passport;
export { Strategy } from './strategies';
export { Authenticator } from './Authenticator';
