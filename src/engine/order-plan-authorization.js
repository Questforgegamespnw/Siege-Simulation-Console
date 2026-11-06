// Internal capability: only the order arbiter should authorize a phase with active commands.
export const ORDER_PLAN_AUTHORIZATION = Symbol('authorized-persistent-command-plan');
