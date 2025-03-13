# Overview

This documentaion outlines the key concepts and interaction between the different technologies used to develop the INTO-CPS Application, as well as the logic and the model management.

## Key components

### Electron

Electron is a framework for building desktop applications using JavaScript, HTML, and CSS. By embedding Chromium and Node.js into its binary, Electron allows you to maintain one JavaScript codebase and create cross-platform apps that work on Windows, macOS, and Linux — no native development experience required.[[1]](https://www.electronjs.org/docs/latest/)

#### BrowserWindow

[BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window) is a class used to create and manage application windows, displaying HTML, CSS and Javascript content. The class BrowserWindow exposes many API for [Window Customization](https://www.electronjs.org/docs/latest/tutorial/window-customization).\
Each BrowserWindows instance is rendered in its own renderer process, operating differently from the main process.

Example of creation of the main window of the application:

```typescript
mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

mainWindow.loadURL(startUrl)
```

##### Processes model and Context management

Electron applications operate with two types of processes:

- Main Process: This manages the whole lifespan of the application, acting as the application's entry point. It runs on a Node.js environment, thus having the ability to use `require`.  This can create windows and interact with the operative system with native APIs. [2](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process)
- Renderer Process: Each `BrowserWindow` runs in its own renderer process, responsible for rendering web content (the UI of the application). The renderer has no direct access to Node.js APIs and Electron's native desktop functionality

To securely share information between the main and renderer processes through [**Preload Scripts**](https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts) and [**IPC**](https://www.electronjs.org/docs/latest/tutorial/ipc).

##### Preload Scripts

The preload script bridges the main process and the renderer process in a secure manner. It runs in a context that has access to both Node.js and the DOM but does not expose the full Node.js API to the renderer, preventing vulnerabilities for malicious attacks.

Example of `preload.js`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => ipcRenderer.send('show-notification', message, type),
  onSimulationStatus: (callback) => ipcRenderer.on('simulation-status', callback),
});
```

#### Inter-Process Communication

Electron provides IPC for communication between the main process and renderer processes. IPC helps manage the context by sending and receiving messages, allowing synchronized application states. IPC is the only way to perform many common tasks, such as calling a native API from the UI or triggering changes in the web contents from native menus.
Processes communicate by passing messages through `ipcMain` and `ipcRenderer` modules.

Example of IPC usage for the main process:

```typescript
ipcMain.on('show-notification', (event, message: string, type) => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('show-notification', message, type);
  }
});
```

Example of IPC usage for the renderer process:

```typescript
window.electronAPI.sendNotification('Simulation started', 'success');
```

### React App

The core `App` component initializes the UI for the INTO-CPS Application, manages global states and handle the navigation.\
The `Bottom.tsx` component allows users to start/stop the Maestro engine, required to run a CoSimulation, using `CoSimulationApi`. The `CoSimulation.tsx` component displays simulation status and results path using the useCosimulation hook, which makes use of `CoSimulationApi`.\
Error handling is managed by `ErrorSnackbar.tsx`, which is being triggered and updated at each error captured, and displayed in a notification at the bottom of the screen.

#### Package Diagram

![Package Diagram React App](./media/react_app_package.png)

#### Class Diagram

```mermaid
classDiagram
    class App {
        - darkMode: boolean
        - sidebarOpen: boolean
        - sidebarWidth: number
        + toggleDarkMode(): void
        + toggleSidebar(): void
        + handleResize(): void
        + handleToggleDarkMode(): void
        + handleError(errorMessage: string): void
    }

    class Sidebar {
        - isResponsive: boolean
        - manualOpen: boolean
        + handleResize(): void
        + handleToggle(): void
    }

    class Bottom {
        - maestroRunning: boolean
        + toggleMaestroState(): Promise<void>
    }

    class ErrorSnackbar {
        - open: boolean
        - message: string
        - severity: 'info' | 'error' | 'warning' | 'success'
        + handleError(errorMessage: string): void
        + handleClose(): void
    }

    class CoSimulation {
        + error: string | null
        + simulationStatus: string
        + resultsPath: string | null
    }

    class useCosimulation {
        - error: string | null
        - simulationStatus: string
        - resultsPath: string | null
        + handleStatusUpdate(event: unknown, status: string): Promise<void>
        + handleCoeError(event: unknown, errorMessage: string): void
        + handleCoeReset(): void
    }

    class CosimulationAPI {
        + maestro(args): Promise<void>
        + onSimulationStatus(callback): void
        + removeSimulationStatusListener(callback): void
        + addCoeErrorListener(callback): void
        + removeCoeErrorListener(): void
        + getSessionId(): Promise<string | null>
        + getSimulationResult(sessionId: string): Promise<string>
    }

    App --> Sidebar
    App --> Bottom
    App --> ErrorSnackbar
    App --> CoSimulation
    CoSimulation --> useCosimulation
    Bottom --> CosimulationAPI
    useCosimulation --> CosimulationAPI
    ErrorSnackbar --> CosimulationAPI
```

#### Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Sidebar
    participant Bottom
    participant CoSimulation
    participant ErrorSnackbar
    participant CosimulationAPI
    participant ElectronAPI
    participant MaestroManager
    participant SimulationContext

    %% 1. App Initialization %%
    User->>App: Open Application
    App->>Sidebar: mount()
    App->>Bottom: mount()
    App->>CoSimulation: mount()
    App->>ErrorSnackbar: mount()

    %% 2. Starting Maestro %%
    User->>Bottom: Click "Start CoE" Button (toggleMaestroState)
    Bottom->>CosimulationAPI: maestro({ type: 'start' })
    CosimulationAPI->>ElectronAPI: invoke('maestro', { type: 'start' })
    ElectronAPI->>MaestroManager: startMaestro()
    MaestroManager->>MaestroManager: Check if port is in use
    MaestroManager->>MaestroManager: Extract and launch Maestro
    MaestroManager->>ElectronAPI: emit('simulation-status', "Maestro Started")
    ElectronAPI->>CosimulationAPI: emit('simulation-status', "Maestro Started")
    CosimulationAPI->>Bottom: Update UI (Status: "Maestro Started")

    %% 3. Running Simulation %%
    User->>Sidebar: Click "CoSimulation" Navigation
    Sidebar-->>CoSimulation: Render Component
    User->>CoSimulation: Click "Start Simulation" Button
    CoSimulation->>CosimulationAPI: maestro({ type: 'start-simulation' })
    CosimulationAPI->>ElectronAPI: invoke('maestro', { type: 'start-simulation' })
    ElectronAPI->>MaestroManager: startSimulation()
    MaestroManager->>SimulationContext: getSessionId()
    MaestroManager->>ElectronAPI: emit('simulation-status', "Simulating...")
    ElectronAPI->>CosimulationAPI: emit('simulation-status', "Simulating...")
    CosimulationAPI->>CoSimulation: Update UI (Status: "Simulating...")

    %% 4. Simulation Completion %%
    MaestroManager->>ElectronAPI: emit('simulation-status', "Simulation Completed")
    ElectronAPI->>CosimulationAPI: emit('simulation-status', "Simulation Completed")
    CosimulationAPI->>CoSimulation: Update UI (Status: "Simulation Completed")

    %% 5. Fetching Results %%
    CoSimulation->>CosimulationAPI: maestro({ type: 'get-result' })
    CosimulationAPI->>ElectronAPI: invoke('maestro', { type: 'get-result' })
    ElectronAPI->>MaestroManager: getSimulationResult()
    MaestroManager->>SimulationContext: getSessionId()
    MaestroManager->>MaestroManager: Fetch simulation results
    MaestroManager-->>ElectronAPI: return resultPath
    ElectronAPI-->>CosimulationAPI: return resultPath
    CosimulationAPI-->>CoSimulation: Display results path

    %% 6. Error Handling and Snackbar Display %%
    MaestroManager->>ElectronAPI: emit('show-error', errorMessage)
    ElectronAPI->>CosimulationAPI: emit('show-error', errorMessage)
    CosimulationAPI->>ErrorSnackbar: Display error notification
    ErrorSnackbar-->>User: Show Error in UI

```

### Maestro Management Model

The system is designed to manage the startup of Maestro server and the CoSimulation lifecycle through modular components:

- `MaestroManager`: Manages the CoSimulation lifecycle, allowing for starting/stopping Maestro, initializing, running, and retrieving simulation results.
- `SimulationContext`: Stores and retrieves the current simulation session ID.
- `CosimulationAPI`: Interfaces with `MaestroManager` to trigger simulation actions, serving as the bridge between the frontend and backend.
- `MaestroUtils`: Provides utility functions for managing ports and external processes.
- `ErrorHandler`: Centralized error handling throughout the simulation process.
- `MenuManager`: Manages UI state related to simulation controls.

```mermaid
classDiagram
    %% Simulation Context %%
    class SimulationContext {
        - sessionId: string | null
        + getSessionId(): string | null
        + setSessionId(id: string): void
    }

    %% Maestro Manager %%
    class MaestroManager {
        + startMaestro(): Promise<MaestroResponse>
        + stopMaestro(): Promise<void>
        + startSimulation(): Promise<void>
        + getSimulationResult(sessionId: string): Promise<string>
        - extractMaestroJar(): void
        - sendSimulationStatus(status: string): void
        - isSimulationInProgress: boolean
        - maestroProcess: ChildProcess | null
    }

    %% Cosimulation API %%
    class CosimulationAPI {
        + maestro(type: string, data: unknown): Promise<MaestroResponse>
        + onSimulationStatus(callback): void
        + removeSimulationStatusListener(callback): void
        + addCoeErrorListener(callback): void
        + removeCoeErrorListener(): void
        + addCoeResetListener(callback): void
        + removeCoeResetListener(): void
        + getSessionId(): Promise<string | null>
        + getConfig(): Promise<ConfigMaestro | null>
        + getSimulationResult(sessionId: string): Promise<string>
    }

    %% Electron API %%
    class ElectronAPI {
        + on(event: string, callback): void
        + off(event: string, callback): void
        + invoke(channel: string, args?): Promise<unknown>
        + send(channel: string, args...): void
    }

    %% Error Handler %%
    class ErrorHandler {
        + handleError(error): void
        + sendNotification(message, type): void
    }

    %% Maestro Process Utilities %%
    class MaestroUtils {
        + isPortInUse(port: number): Promise<boolean>
        + killProcessOnPort(port: number): Promise<void>
    }

    %% Menu Manager %%
    class MenuManager {
        + updateCosimulationMenu(enabled: boolean): void
    }

    %% Config Manager %%
    class ConfigManager {
        + setProjectPath(path: string): void
        + getConfig(): ConfigMaestro | null
    }

    SimulationContext <|-- MaestroManager
    CosimulationAPI --> MaestroManager
    MaestroManager --> MaestroUtils
    MaestroManager --> ErrorHandler
    MaestroManager --> MenuManager
    MaestroManager --> SimulationContext
    CosimulationAPI --> ElectronAPI
    ElectronAPI --> ErrorHandler
    ElectronAPI --> ConfigManager
    ElectronAPI --> MenuManager
```

The following sequence diagram shows the internal workflow of the MaestroManager during the cosimulation process, covering the startup of the Maestro server, the CoSimulation execution, result handling, and error management

```mermaid
sequenceDiagram
    participant MM as MaestroManager
    participant MU as MaestroUtils
    participant EH as ErrorHandler
    participant MC as SimulationContext
    participant Menu as MenuManager

    %% Starting Maestro %%
    MM->>MU: isPortInUse(MAESTRO_PORT)
    MU-->>MM: Port status
    MM->>MU: killProcessOnPort(MAESTRO_PORT) (if needed)
    MM->>MM: extractMaestroJar()
    MM->>MM: spawn Maestro JAR
    MM->>Menu: updateCosimulationMenu(mainWindow, true)

    %% Maestro successfully started %%
    MM->>MM: sendSimulationStatus("Maestro Started")

    %% Simulation Initialization %%
    MM->>MM: load experiment.json, multi-model.json
    MM->>MU: resolve FMUs paths
    MM->>MM: fetch(`${MAESTRO_BASE_URL}/createSession`)
    MM->>MC: setSessionId(sessionId)
    MM->>MM: sendSimulationStatus("Simulation Initialized")

    %% Running Simulation %%
    MM->>MM: fetch(`${MAESTRO_BASE_URL}/initialize/${sessionId}`)
    MM->>MM: fetch(`${MAESTRO_BASE_URL}/simulate/${sessionId}`)
    MM->>MM: sendSimulationStatus("Simulating...")

    %% Simulation Completion %%
    MM->>MM: sendSimulationStatus("Simulation Completed")

    %% Retrieving Results %%
    MM->>MM: fetch(`${MAESTRO_BASE_URL}/result/${sessionId}/plain`)
    MM->>MM: save CSV to outputPath

    %% Handling Errors %%
    MM->>EH: handleError(error)

```

### Maestro Model and React communication using IPC

This squence diagram illustrates the interaction between the Maestro Model and the Electron IPC system for managing the CoSimulation process. The process involves:

- Starting the maestro server from the `Bottom.tsx` bar
- Running the CosSmulation from the application menu
- Handling result retrieval
- Error management through `ErrorSnackbar.tsx`.

```mermaid
sequenceDiagram
    %% Participants %%
    participant Bottom as Bottom.tsx (Start Maestro)
    participant IPC as IPC (ipcMain)
    participant MM as MaestroManager
    participant MU as MaestroUtils
    participant MC as SimulationContext
    participant Menu as Electron Menu (Start Simulation)
    participant MenuManager as MenuManager
    participant EH as ErrorHandler
    participant Snackbar as ErrorSnackbar (UI Error Display)

    %% 1. Starting Maestro from Bottom.tsx %%
    Bottom->>IPC: invoke('maestro', { type: 'start' })
    IPC->>MM: startMaestro()
    MM->>MU: isPortInUse(MAESTRO_PORT)
    MU-->>MM: Port status
    MM->>MU: killProcessOnPort(MAESTRO_PORT) (if needed)
    MM->>MM: extractMaestroJar()
    MM->>MM: spawn Maestro JAR
    MM->>MenuManager: updateCosimulationMenu(mainWindow, true)
    MM->>IPC: emit('simulation-status', "Maestro Started")

    %% 2. Bottom.tsx Receives Status Update %%
    IPC->>Bottom: simulation-status("Maestro Started")

    %% 3. Starting Simulation from Electron Menu %%
    Menu->>IPC: emit('menu-start-simulation')
    IPC->>MM: startSimulation()
    MM->>MM: load experiment.json, multi-model.json
    MM->>MU: resolve FMUs paths
    MM->>MM: fetch('${MAESTRO_BASE_URL}/createSession')
    MM->>MC: setSessionId(sessionId)
    MM->>IPC: emit('simulation-status', "Simulation Initialized")

    %% 4. Bottom.tsx Receives Simulation Status %%
    IPC->>Bottom: simulation-status("Simulation Initialized")

    %% 5. Running Simulation %%
    MM->>MM: fetch('${MAESTRO_BASE_URL}/initialize/${sessionId}')
    MM->>MM: fetch('${MAESTRO_BASE_URL}/simulate/${sessionId}')
    MM->>IPC: emit('simulation-status', "Simulating...")
    IPC->>Bottom: simulation-status("Simulating...")

    %% 6. Simulation Completion %%
    MM->>IPC: emit('simulation-status', "Simulation Completed")
    IPC->>Bottom: simulation-status("Simulation Completed")

    %% 7. Fetching Results %%
    Bottom->>IPC: invoke('maestro', { type: 'get-result', data: { sessionId } })
    IPC->>MM: getSimulationResult(sessionId)
    MM->>MM: fetch('${MAESTRO_BASE_URL}/result/${sessionId}/plain')
    MM->>MM: save CSV to outputPath
    MM-->>IPC: return results path
    IPC-->>Bottom: results path

    %% 8. Error Handling and Snackbar Display %%
    MM->>EH: handleError(error)
    EH->>IPC: emit('show-error', errorMessage)
    IPC->>Snackbar: show-error(errorMessage)
    Snackbar->>Snackbar: Display error in UI
```

### React -> IPC Communication

The interaction between the React frontend and the Electron logic is being managed through IPC.

- When a user interacts with the application, the React frontend calls methods exposed through `window.cosimulationAPI`. This API works as a secure bridge between the frontend and the Electron logic.
- For instance, invoking `startMaestro()` from the frontend (`Bottom`) triggers `start-maestro`, an event handled by `ipcMain` in the main Electron process.
- The `startMaestro` function is then executed by the backend, initiating the Maestro process.
- The user interface receives real-time feedback thanks to the emitted statuses from the backend, like `simulation-status-update`, captured by the hook `useCosimulation`, which updates the UI.

```mermaid
sequenceDiagram
    %% Participants %%
    participant User as User
    participant Bottom as Bottom.tsx (React)
    participant CosimAPI as window.cosimulationAPI (IPC Renderer)
    participant IPCMain as ipcMain (Electron Main)
    participant Maestro as MaestroManager (Backend Process)
    participant ErrorHandler as ErrorHandler
    participant Snackbar as ErrorSnackbar (React UI)

    %% 1. User Starts Maestro %%
    User->>Bottom: Click "Start CoE" Button
    Bottom->>CosimAPI: maestro({ type: 'start' })
    CosimAPI->>IPCMain: invoke('maestro', { type: 'start' })
    IPCMain->>Maestro: startMaestro()
    Maestro-->>IPCMain: emit('simulation-status', "Maestro Started")
    IPCMain-->>CosimAPI: simulation-status("Maestro Started")
    CosimAPI-->>Bottom: Update UI (Status: "Maestro Started")

    %% 2. Running Simulation %%
    User->>Bottom: Click "Start Simulation" Button
    Bottom->>CosimAPI: maestro({ type: 'start-simulation' })
    CosimAPI->>IPCMain: invoke('maestro', { type: 'start-simulation' })
    IPCMain->>Maestro: startSimulation()
    Maestro-->>IPCMain: emit('simulation-status', "Simulating...")
    IPCMain-->>CosimAPI: simulation-status("Simulating...")
    CosimAPI-->>Bottom: Update UI (Status: "Simulating...")

    %% 3. Simulation Completed %%
    Maestro-->>IPCMain: emit('simulation-status', "Simulation Completed")
    IPCMain-->>CosimAPI: simulation-status("Simulation Completed")
    CosimAPI-->>Bottom: Update UI (Status: "Simulation Completed")

    %% 4. Fetching Results %%
    User->>Bottom: Click "Get Results"
    Bottom->>CosimAPI: maestro({ type: 'get-result', data: { sessionId } })
    CosimAPI->>IPCMain: invoke('maestro', { type: 'get-result', data: { sessionId } })
    IPCMain->>Maestro: getSimulationResult(sessionId)
    Maestro->>Maestro: fetch(`${MAESTRO_BASE_URL}/result/${sessionId}/plain`)
    Maestro->>Maestro: save CSV to outputPath
    Maestro-->>IPCMain: return results path
    IPCMain-->>CosimAPI: results path
    CosimAPI-->>Bottom: Update UI with results path

    %% 5. Error Handling %%
    Maestro-->>ErrorHandler: handleError(error)
    ErrorHandler->>IPCMain: emit('show-error', errorMessage)
    IPCMain-->>CosimAPI: show-error(errorMessage)
    CosimAPI-->>Snackbar: Display Error Snackbar
    Snackbar-->>User: Show Error Notification
```
