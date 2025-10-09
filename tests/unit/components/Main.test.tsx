import React from "react";
import { render, screen } from "@testing-library/react";
import Main from "../../../src/components/Main";

jest.mock("../../../src/components/SimulationGuide", () => {
  const MockComponent = () => <div data-testid="simulation-guide">Mock Simulation Guide</div>;
  MockComponent.displayName = 'MockSimulationGuide';
  return MockComponent;
});

describe("Main component", () => {
  it("renders the welcome heading", () => {
    render(<Main />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("INTO-CPS > Welcome");
  });

  it("renders the welcome message", () => {
    render(<Main />);
    expect(screen.getByText("Welcome to the INTO-CPS Application")).toBeInTheDocument();
  });

  it("renders the application version", () => {
    render(<Main />);
    const versionElement = screen.getByText("5.1.1");
    expect(versionElement).toBeInTheDocument();
    expect(versionElement).toHaveAttribute("id", "appVersion");
  });

  it("renders the SimulationGuide component", () => {
    render(<Main />);
    expect(screen.getByTestId("simulation-guide")).toBeInTheDocument();
  });
});
