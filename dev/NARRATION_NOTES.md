# Hold Until Dawn — State-Driven Narrative Generator Addendum v0.1

**Status:** Approved design direction  
**Priority:** Deferred implementation; event-log support should be developed alongside the siege engine.

## 1. Purpose

The Siege Console will provide atmospheric, GM-facing battlefield narration derived from actual simulation events and persistent battlefield conditions.

The narrator is a **presentation layer**, not a simulation system. It describes the evolving battle without independently determining outcomes, inventing events, or modifying game state.

**Core principle:** The simulation establishes what is true. The narrative generator describes it. The GM determines how to present or act upon it.

## 2. Three Independent Data Layers

**A. Authoritative Siege State**
- Current unit positions, Cohesion, orders, engagements, and movement.
- Sector and position control.
- Reinforcement routes, breaches, and battlefield conditions.
- Dawnstone status and other objective conditions.

**B. Battlefield Event History**
- Records meaningful changes across Siege Phases.
- Tracks engagements, arrivals, retreats, broken formations, position captures, reinforcements, and changes in relationships.
- Supports detecting sustained conditions and improving or deteriorating situations.

**C. Narrative Memory**
- Tracks previously selected passages and described developments.
- Prevents excessive repetition.
- Supports narrative continuity across Siege Phases.
- Remains entirely separate from combat calculations and authoritative game state.
- Can be reset or regenerated without affecting the simulation.

## 3. Narrative Categories

**Transition Narration:** A meaningful battlefield relationship changes, such as a company breaking, reinforcements arriving, or a Black Knight reaching the parapet.

**Sustained-State Narration:** An existing condition continues across multiple phases, such as defenders maintaining a contested position under sustained pressure.

**Relationship Narration:** Describes interactions between units, positions, and battlefield conditions, such as Archers supporting Spearmen or Harpies disrupting ranged support.

The generator should recognize **what changed, what continues, and what is beginning to happen**.

## 4. Narrative Eligibility and Selection

Each authored passage may define:

- **Conditions:** Required events, unit types, Cohesion ranges, engagements, or area states.
- **Scope:** Position, sector, or fortress-wide.
- **Lens:** Infantry, Archers, Swarmers, Harpies, Black Knights, civilians, Dawnstone, etc.
- **Priority:** Relative narrative significance.
- **Repeat Policy:** One-time, state-transition, or recurring with variation.
- **Continuity Requirements:** Previous events or sustained conditions necessary for eligibility.

A passage becomes eligible only when its conditions are satisfied.

Narrative selection should avoid repetitive catastrophe reporting and recognize successful defenses, stabilization, reinforcement, and counterattacks.

## 5. Authored Passage Library

Use **complete, prewritten narrative passages** with limited variable substitution.

Example:

> The {unitName} continue to maintain their tenuous hold on the {positionName}. Their ranks have thinned, but they still meet the attacking waves with steel. For now.

Avoid complex procedural sentence assembly, dynamic grammar construction, or runtime AI dependency.

The generator should operate deterministically and offline.

## 6. GM Presentation

The console should eventually offer:

- A concise operational summary of mechanical developments.
- One or two contextually appropriate narrative passages.
- Optional alternative passages or narrative lenses.
- Access to additional eligible descriptions when desired.

Narration may naturally suggest tactical opportunities, including elite-unit encounters or a possible Dawnstone final stand, but **must never automatically trigger tactical mode**.

## 7. Development Sequence

1. Implement structured battlefield events alongside movement, combat, and position-control systems.
2. Add event-history and sustained-condition detection.
3. Implement narrative eligibility, selection, and separate narrative memory.
4. Populate a small initial library of authored passages.
5. Expand narrative variety and GM presentation controls after simulation testing.

## 8. Non-Negotiable Constraints

- Narration cannot modify authoritative siege state.
- Narration cannot invent movements, casualties, reinforcements, breaches, or victories.
- Narrative memory cannot influence combat resolution.
- Broken companies are not automatically described as destroyed or absent.
- Positions are not described as captured until physical control is established.
- Tactical encounters remain GM-directed.
- The Dawnstone's survival until sunrise remains the ultimate Coalition victory condition, regardless of other battlefield losses.

**Implementation principle:** Build a reliable battlefield correspondent, not a procedural novelist.