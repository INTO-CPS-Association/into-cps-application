import { handleError } from "../../../src/utils/errorHandler";
import { sendNotification } from "../../../src/utils/errorHandler";

jest.mock("../../../src/utils/logger", () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

// helper
const setProcessType = (
  value: 'renderer' | 'browser' | 'worker' | 'utility' | undefined
) => {
  Object.defineProperty(process, 'type', {
    value,
    configurable: true,
  });
};

describe("errorHandler", () => {
  const originalProcessType = process.type;

  beforeEach(() => {
    setProcessType(originalProcessType);

    window.electronAPI = {
      dispatchActionToMain: jest.fn(),
      addToggleDarkModeListener: jest.fn(),
      removeToggleDarkModeListener: jest.fn(),
      addErrorListener: jest.fn(),
      removeErrorListener: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      addNotificationListener: jest.fn(),
      removeNotificationListener: jest.fn(),
      sendNotification: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn()
    };
  });

  afterEach(() => {
    jest.resetModules();
    setProcessType(originalProcessType);
  });

  it("handles error in renderer", () => {
    setProcessType("renderer");
    handleError(new Error("Test error"));
  });

  it("handles error in main", () => {
    jest.resetModules();
  
    jest.isolateModules(() => {
      jest.doMock("electron", () => ({
        ipcMain: { emit: jest.fn() },
      }));
  
      jest.doMock("../../../src/utils/logger", () => ({
        logError: jest.fn(),
        logWarn: jest.fn(),
      }));
  
      setProcessType("browser");
  
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { handleError } = require("../../../src/utils/errorHandler");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { logError } = require("../../../src/utils/logger");
      handleError("Main error");
  
      expect(logError).toHaveBeenCalledWith("[Error Main Process]: Main error");
    });
  });
  
  it("logs warning on unknown process type", () => {
    jest.resetModules();
  
    jest.isolateModules(() => {
      jest.doMock("../../../src/utils/logger", () => ({
        logError: jest.fn(),
        logWarn: jest.fn(),
      }));
  
      setProcessType(undefined);
  
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { handleError } = require("../../../src/utils/errorHandler");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { logWarn } = require("../../../src/utils/logger");
  
      handleError("Unknown");
  
      expect(logWarn).toHaveBeenCalledWith("[Error] Unknown process type.");
    });
  });
 
});

describe("sendNotification", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("sends notification in renderer", () => {
    setProcessType("renderer");

    sendNotification("Notify me", "info");

    expect(window.electronAPI.dispatchActionToMain).toHaveBeenCalledWith({
      type: "notification",
      payload: { message: "Notify me", type: "info" },
    });
  });

  it("sends notification in main process (browser)", () => {
    jest.resetModules();
  
    const mockEmit = jest.fn();
  
    jest.isolateModules(() => {
      jest.doMock("electron", () => ({
        ipcMain: { emit: mockEmit },
      }));
  
      setProcessType("browser");
  
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sendNotification } = require("../../../src/utils/errorHandler");
  
      sendNotification("Test notify", "success");
  
      expect(mockEmit).toHaveBeenCalledWith(
        "trigger-notification",
        null,
        "Test notify",
        "success"
      );
    });
  });  
   
  it("logs warning on unknown process type (sendNotification)", () => {
    jest.resetModules();
  
    jest.isolateModules(() => {
      jest.doMock("../../../src/utils/logger", () => ({
        logError: jest.fn(),
        logWarn: jest.fn(),
      }));
  
      setProcessType(undefined);
  
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sendNotification } = require("../../../src/utils/errorHandler");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { logWarn } = require("../../../src/utils/logger");
  
      sendNotification("Test message", "warning");
  
      expect(logWarn).toHaveBeenCalledWith("[Notification] Unknown process type.");
    });
  });
  
});