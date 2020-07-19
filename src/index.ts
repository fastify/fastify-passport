import Authenticator from "./Authenticator";
import "./type-extensions"; // necessary to make sure that the fastify types are augmented
const passport = new Authenticator();

export default passport;
export { Strategy } from "./strategies";
