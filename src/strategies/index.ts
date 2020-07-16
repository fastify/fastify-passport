import type { Strategy as ExpressStrategy } from "passport";
import type { FastifyStrategy } from "./base";
export * from "./base";
export * from "./session";

export type Strategy = FastifyStrategy | ExpressStrategy;
