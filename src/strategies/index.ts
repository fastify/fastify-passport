import type { Strategy as ExpressStrategy } from 'passport'
import { Strategy } from './base'
export { Strategy } from './base'
export { SessionStrategy } from './SessionStrategy'

export type AnyStrategy = Strategy | ExpressStrategy
