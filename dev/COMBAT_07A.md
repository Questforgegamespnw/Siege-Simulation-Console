# Milestone 0.7A — Combat calculation slice

Pure CP, ratio-band attrition, ranged exterior coverage, simultaneous application, and no automatic withdrawal.

**Explicit clusters only:** engagement detection, physical capture, inner support eligibility, position threat, light/priest modifiers, direct ranged targeting, and phase orchestration remain unimplemented. Units cannot be counted twice in one phase; attempting to allocate a shared Archer to two separate clusters raises an error rather than silently doubling its CP. A future allocator will combine/partition exterior engagements explicitly.

**Unopposed engagements:** no attrition is assigned; capture still belongs to movement/control. **Zero cohesion:** remains at location and contributes zero CP; destruction/removal is unresolved.

**Numerics:** preserve fractional cohesion; no rounding until presentation. **Ranged support AR:** 90% while contributing at range, not in melee. Shroud suppression affects ranged CP, not melee CP. The scenario's existing ratio bands are authoritative.
