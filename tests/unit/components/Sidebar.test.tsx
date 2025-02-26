import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../../src/components/Sidebar";
import "@testing-library/jest-dom";
import { styleConstants } from "../../../src/utils/constants";

describe("Sidebar component", () => {
  it("renders the sidebar with Home and Cosimulation links", () => {
    render(<Sidebar open={true} toggleSidebar={jest.fn()} />, {
      wrapper: MemoryRouter,
    });

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Cosimulation")).toBeInTheDocument();
  });

  it("toggles sidebar when the button is clicked", () => {
    const toggleSidebar = jest.fn();
    render(<Sidebar open={true} toggleSidebar={toggleSidebar} />, {
      wrapper: MemoryRouter,
    });

    const toggleButton = screen.getByRole("button");
    fireEvent.click(toggleButton);

    expect(toggleSidebar).toHaveBeenCalled();
  });

  it("displays only icons when sidebar is collapsed", () => {
    render(<Sidebar open={false} toggleSidebar={jest.fn()} />, {
      wrapper: MemoryRouter,
    });

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Cosimulation")).not.toBeInTheDocument();
  });

  it("expands the sidebar when clicking the menu icon in responsive mode", async () => {
    global.innerWidth = styleConstants.INNER_WIDTH_SIZE - 1;
    window.dispatchEvent(new Event("resize"));

    const { container } = render(<Sidebar open={false} toggleSidebar={jest.fn()} />, {
      wrapper: MemoryRouter,
    });

    const toggleButton = container.querySelector("button");
    if (toggleButton) fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(container.querySelector(".MuiDrawer-paper")).toHaveStyle(
        `width: ${styleConstants.DRAWER_WIDTH}px`
      );
    });
  });

  it("collapses the sidebar when clicking the close icon", async () => {
    const { container } = render(<Sidebar open={true} toggleSidebar={jest.fn()} />, {
      wrapper: MemoryRouter,
    });

    const toggleButton = container.querySelector("button");
    if (toggleButton) fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(container.querySelector(".MuiDrawer-paper")).toHaveStyle(
        `width: ${styleConstants.COLLAPSED_WIDTH}px`
      );
    });
  });
});