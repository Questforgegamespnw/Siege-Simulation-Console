# 0.7C provisional movement-to-combat integration

- `resolveSiegePhase` now runs movement and combat in order, with simultaneous attrition.
- `host-assault-contact` allows a Host company to enter melee from its matching climb stage without instantly capturing a Coalition-controlled wall position.
- Conventional frontage at wall contact is capped at three Host companies per position.
- No automatic retreat, capture, Position Threat, or dawn victory logic. Those remain future milestones.
- Existing CP, AR, movement, suppression, and attrition values are unchanged.
- `tests/integrated-contact-07c.test.js` tests genuine movement orders, not scripted relocation of Host units between phases. Initial Coalition deployment is an explicit fixture.
- Important limitation: assault contact is physical presence, not a completed physical capture; Host exit/corridor and later breach control need more work.
