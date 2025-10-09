import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProviderContext, useTheme } from '../../../src/contexts/ThemeContext';

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  (window as any).electronAPI = undefined;
});

const Consumer: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <div>
      <span data-testid="dark">{String(darkMode)}</span>
      <button onClick={toggleDarkMode}>toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  it('registers and unregisters electronAPI listeners on mount/unmount', () => {
    const onMock = jest.fn();
    const offMock = jest.fn();
    const addListenerMock = jest.fn();
    const removeListenerMock = jest.fn();
    const toggleMock = jest.fn();

    (window as any).electronAPI = {
      on: onMock,
      off: offMock,
      addToggleDarkModeListener: addListenerMock,
      removeToggleDarkModeListener: removeListenerMock,
      toggleDarkMode: toggleMock,
    };

    const { unmount } = render(
      <ThemeProviderContext>
        <Consumer />
      </ThemeProviderContext>
    );

    expect(onMock).toHaveBeenCalledWith('dark-mode-update', expect.any(Function));
    expect(addListenerMock).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    expect(offMock).toHaveBeenCalledWith('dark-mode-update', expect.any(Function));
    expect(removeListenerMock).toHaveBeenCalled();
  });

  it('updates darkMode when dark-mode-update event is emitted', () => {
    let capturedHandler: ((...args: unknown[]) => void) | undefined;
    const onMock = jest.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'dark-mode-update') capturedHandler = cb;
    });
    const offMock = jest.fn();
    const addListenerMock = jest.fn();
    const removeListenerMock = jest.fn();

    (window as any).electronAPI = {
      on: onMock,
      off: offMock,
      addToggleDarkModeListener: addListenerMock,
      removeToggleDarkModeListener: removeListenerMock,
      toggleDarkMode: jest.fn(),
    };

    render(
      <ThemeProviderContext>
        <Consumer />
      </ThemeProviderContext>
    );

    expect(screen.getByTestId('dark').textContent).toBe('false');

    act(() => {
      capturedHandler?.(true);
    });

    expect(screen.getByTestId('dark').textContent).toBe('true');

    act(() => {
      (window as any).electronAPI.addToggleDarkModeListener.mock.calls[0][0]();
    });

    expect(screen.getByTestId('dark').textContent).toBe('false');
  });

  it('toggleDarkMode calls electronAPI.toggleDarkMode', () => {
    const onMock = jest.fn();
    const offMock = jest.fn();
    const addListenerMock = jest.fn();
    const removeListenerMock = jest.fn();
    const toggleMock = jest.fn();

    (window as any).electronAPI = {
      on: onMock,
      off: offMock,
      addToggleDarkModeListener: addListenerMock,
      removeToggleDarkModeListener: removeListenerMock,
      toggleDarkMode: toggleMock,
    };

    render(
      <ThemeProviderContext>
        <Consumer />
      </ThemeProviderContext>
    );

    fireEvent.click(screen.getByText('toggle'));
    expect(toggleMock).toHaveBeenCalled();
  });
});
