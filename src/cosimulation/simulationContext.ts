interface SimulationContext {
  sessionId: string | null;
}

const simulationContext: SimulationContext = {
  sessionId: null,
};

export const getSessionId = (): string | null => {
  return simulationContext.sessionId;
};

export const setSessionId = (id: string): void => {
  simulationContext.sessionId = id;
};
