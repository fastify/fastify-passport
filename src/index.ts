import Authenticator from "./authenticator";

const passport = new Authenticator();

export default passport;
export { Strategy } from "./strategies";
export { DoneFunction } from "./authenticator";
