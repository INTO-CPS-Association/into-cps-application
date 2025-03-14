import { getSessionId, setSessionId } from "../../../src/cosimulation/simulationContext";

describe("simulationContext", () => {
  beforeEach(() => {
    setSessionId(null as unknown as string);
  });

  it("returns null when no session ID is set", () => {
    expect(getSessionId()).toBeNull();
  });

  it("sets and retrieves the session ID correctly", () => {
    setSessionId("test-session-id");
    expect(getSessionId()).toBe("test-session-id");
  });

  it("overwrites an existing session ID", () => {
    setSessionId("first-session-id");
    setSessionId("second-session-id");
    expect(getSessionId()).toBe("second-session-id");
  });
});