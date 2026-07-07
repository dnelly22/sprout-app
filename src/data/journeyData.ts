import { JOURNEY_SCENARIOS } from './journeyScenarios';
import type { JourneyArea, JourneyScenario } from '../types/journey';

// Heavy module: pulls in the full (auto-generated) JOURNEY_SCENARIOS array.
// Only import from here behind a lazy boundary (see JourneyFlow) so the scenario
// data lands in its own chunk and never inflates the initial bundle.

export { JOURNEY_SCENARIOS };

export const journeyByCategory = (cat: JourneyArea): JourneyScenario[] =>
  JOURNEY_SCENARIOS.filter((s) => s.category === cat).sort((a, b) => a.index - b.index);

export const journeyById = (id: string): JourneyScenario | undefined =>
  JOURNEY_SCENARIOS.find((s) => s.id === id);
