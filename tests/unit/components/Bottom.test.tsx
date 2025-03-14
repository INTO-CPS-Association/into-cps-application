import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Bottom from "../../../src/components/Bottom";

describe("Bottom component", () => {

  it("renders Start CoE button initially", () => {
    render(<Bottom sidebarWidth={250} sidebarOpen={true} />);
    expect(screen.getByText(/Start CoE/i)).toBeInTheDocument();
  });

  it("toggles button text on click", async () => {
    render(<Bottom sidebarWidth={250} sidebarOpen={true} />);
    const button = screen.getByRole("button", { name: /Start CoE/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Stop CoE/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Stop CoE/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Start CoE/i })).toBeInTheDocument();
    });
  });

  it("logs an error if maestro call fails with success: false", async () => {
    jest.spyOn(window.cosimulationAPI, "maestro").mockResolvedValueOnce({ success: false, error: "Mocked Error" });
  
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  
    render(<Bottom sidebarWidth={250} sidebarOpen={true} />);
    const button = screen.getByRole("button", { name: /Start CoE/i });
  
    fireEvent.click(button);
  
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error toggling Maestro:", "Mocked Error");
    });
  
    consoleErrorSpy.mockRestore();
  });

  it("logs an error if maestro call throws an exception", async () => {
    jest.spyOn(window.cosimulationAPI, "maestro").mockRejectedValueOnce(new Error("Test Exception"));
  
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  
    render(<Bottom sidebarWidth={250} sidebarOpen={true} />);
    const button = screen.getByRole("button", { name: /Start CoE/i });
  
    fireEvent.click(button);
  
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error toggling Maestro:", "Test Exception");
    });
  
    consoleErrorSpy.mockRestore();
  });
  
  
});
