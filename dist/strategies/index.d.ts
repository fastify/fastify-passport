import type { Strategy as ExpressStrategy } from 'passport';
import type { Strategy } from './base';
export * from './base';
export * from './SessionStrategy';
export declare type AnyStrategy = Strategy | ExpressStrategy;
