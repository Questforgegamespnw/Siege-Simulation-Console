export { createInitialState } from './state.js';
export { resolveSiegePhase } from './phase-resolver.js';
export { resolveMovementPhase } from './movement-resolver.js';

// Supported order-aware entry point for headless command simulations.
export {issueStandingOrder,cancelStandingOrder,setCompanyOverride,planPersistentOrders,resolveOrderedSiegePhase} from './persistent-orders.js';
export {canonicalConfig,effectiveRules,validateRules,defaultRules,defaultMechanics} from '../config/rules.js';
