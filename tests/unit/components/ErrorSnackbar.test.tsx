import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import ErrorSnackbar from '../../../src/components/ErrorSnackbar';

beforeEach(() => {
  const mockElectronAPI = {
    addErrorListener: jest.fn(),
    removeErrorListener: jest.fn(),
    addNotificationListener: jest.fn(),
    removeNotificationListener: jest.fn(),
  };

  window.electronAPI = mockElectronAPI as any;
});

afterEach(() => {
  cleanup();
  jest.resetAllMocks();
});

describe('ErrorSnackbar', () => {
  it('registers error and notification listeners on mount', () => {
    render(<ErrorSnackbar />);
    expect(window.electronAPI.addErrorListener).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.addNotificationListener).toHaveBeenCalledTimes(1);
  });

  it('removes error and notification listeners on unmount', () => {
    const { unmount } = render(<ErrorSnackbar />);
    unmount();
    expect(window.electronAPI.removeErrorListener).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.removeNotificationListener).toHaveBeenCalledTimes(1);
  });

  it('displays an error message when error listener is triggered', () => {
    let errorCallback: ((msg: string) => void) | undefined;

    window.electronAPI.addErrorListener = jest.fn(cb => {
      errorCallback = cb;
    });

    render(<ErrorSnackbar />);
    
    act(() => {
      errorCallback?.('Simulated Error');
    });

    expect(screen.getByText('Simulated Error')).toBeInTheDocument();
  });

  it('displays a notification message with type "info"', () => {
    let notifyCallback: ((msg: string, type: any) => void) | undefined;

    window.electronAPI.addNotificationListener = jest.fn(cb => {
      notifyCallback = cb;
    });

    render(<ErrorSnackbar />);

    act(() => {
      notifyCallback?.('Info message', 'info');
    });

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('closes the snackbar when onClose is triggered', () => {
    let errorCallback: ((msg: string) => void) | undefined;

    window.electronAPI.addErrorListener = jest.fn(cb => {
      errorCallback = cb;
    });

    render(<ErrorSnackbar />);

    act(() => {
      errorCallback?.('Error to be closed');
    });

    expect(screen.getByText('Error to be closed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
  });
});
