import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ErrorSnackbar from "../../../src/components/ErrorSnackbar";

describe("ErrorSnackbar component", () => {
  it("subscribes and unsubscribes from error events", () => {
    const addErrorListenerMock = jest.fn();
    const removeErrorListenerMock = jest.fn();

    global.window.electronAPI.addErrorListener = addErrorListenerMock;
    global.window.electronAPI.removeErrorListener = removeErrorListenerMock;

    const { unmount } = render(<ErrorSnackbar />);
    expect(addErrorListenerMock).toHaveBeenCalled();

    unmount();
    expect(removeErrorListenerMock).toHaveBeenCalled();
  });

  it("displays an error message when triggered", async () => {
    let errorCallback: (message: string) => void = () => {};
    global.window.electronAPI.addErrorListener = (callback) => {
      if (callback) errorCallback = callback;
    };

    render(<ErrorSnackbar />);

    await act(async () => {
      errorCallback("Test error");
    });

    await waitFor(() => expect(screen.getByText("Test error")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Test error");
  });

  it("closes the snackbar when the close button is clicked", async () => {
    let errorCallback: (message: string) => void = () => {};
    global.window.electronAPI.addErrorListener = (callback) => {
      if (callback) errorCallback = callback;
    };

    render(<ErrorSnackbar />);

    await act(async () => {
      errorCallback("Test error");
    });

    await waitFor(() => expect(screen.getByText("Test error")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /close/i }));
    });

    await waitFor(() => expect(screen.queryByText("Test error")).not.toBeInTheDocument());
  });
});