import "@testing-library/jest-dom";
import { ICosimulationAPI } from "../src/types/global";

beforeAll(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    * {
      transition: none !important;
      animation: none !important;
    }
  `;
  document.head.appendChild(style);
});


// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextEncoder, TextDecoder } = require("util");
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

const mockCosimulationAPI: ICosimulationAPI = {
  maestro: jest.fn().mockResolvedValue({ success: true }),
  onSimulationStatus: jest.fn(),
  removeSimulationStatusListener: jest.fn(),
  addCoeErrorListener: jest.fn(),
  removeCoeErrorListener: jest.fn(),
  addCoeResetListener: jest.fn(),
  removeCoeResetListener: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getConfig: jest.fn().mockResolvedValue({}),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  getLatestResultFolder: jest.fn().mockResolvedValue("mock-folder-path"),
};

global.window.cosimulationAPI = mockCosimulationAPI;

const mockElectronAPI = {
  dispatchActionToMain: jest.fn(),
  addErrorListener: jest.fn() as jest.Mock<(callback: (message: string) => void) => void>,
  removeErrorListener: jest.fn(),
  addToggleDarkModeListener: jest.fn(),
  removeToggleDarkModeListener: jest.fn(),
  addNotificationListener: jest.fn(),
  removeNotificationListener: jest.fn(),
  sendNotification: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  readFile: jest.fn().mockResolvedValue("mock content"),
  writeFile: jest.fn().mockResolvedValue(true),
};


global.window.electronAPI = mockElectronAPI;
