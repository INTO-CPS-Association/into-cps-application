import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../../../src/components/Sidebar";
import { MemoryRouter } from "react-router-dom";
import React from "react";

jest.mock("../../../src/utils/constants", () => ({
  styleConstants: {
    DRAWER_WIDTH: 240,
    COLLAPSED_WIDTH: 60,
    TOOLBAR_HEIGHT: 64,
    TRANSITION_DURATION: "0.3s",
    INNER_WIDTH_SIZE: 800,
  },
}));

describe("Sidebar component", () => {
  const toggleSidebarMock = jest.fn();

  beforeEach(() => {
    toggleSidebarMock.mockClear();
  });

  const renderSidebar = (open: boolean) =>
    render(
      <MemoryRouter>
        <Sidebar open={open} toggleSidebar={toggleSidebarMock} />
      </MemoryRouter>
    );

  it("renders closed sidebar correctly", () => {
    renderSidebar(false);

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Cosimulation")).not.toBeInTheDocument();
  });

  it("renders open sidebar with navigation items", () => {
    renderSidebar(true);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Cosimulation")).toBeInTheDocument();
  });

  it("calls toggleSidebar when icon button is clicked", () => {
    renderSidebar(true);

    const toggleButton = screen.getByRole("button");
    fireEvent.click(toggleButton);

    expect(toggleSidebarMock).toHaveBeenCalledTimes(1);
  });

  it("switches to responsive mode on small window width", () => {
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));

    renderSidebar(false);

    const toggleButton = screen.getByRole("button");
    fireEvent.click(toggleButton);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Cosimulation")).toBeInTheDocument();
  });
});
