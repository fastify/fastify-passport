import type { Strategy as ExpressStrategy } from 'passport'
import { Strategy } from './base'
export { Strategy } from './base'
export { SessionStrategy } from './session-strategy'

export type AnyStrategy = Strategy | ExpressStrategy
