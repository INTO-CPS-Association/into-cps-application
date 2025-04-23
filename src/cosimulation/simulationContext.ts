interface SimulationContext {
  sessionId: string | null;
}

const simulationContext: SimulationContext = {
  sessionId: null,
};

export const setSessionId = (id: string): void => {
  simulationContext.sessionId = id;
};