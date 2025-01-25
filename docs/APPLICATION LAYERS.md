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
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  startMaestro: () => ipcRenderer.invoke('start-maestro')
});
```

#### Inter-Process Communication

Electron provides IPC for communication between the main process and renderer processes. IPC helps manage the context by sending and receiving messages, allowing synchronized application states. IPC is the only way to perform many common tasks, such as calling a native API from the UI or triggering changes in the web contents from native menus.
Processes communicate by passing messages through `ipcMain` and `ipcRenderer` modules.

Example of IPC usage for the main process:

```typescript
ipcMain.handle('start-maestro', startMaestro);
```

Example of IPC usage for the renderer process:

```typescript
window?.cosimulationAPI?.startMaestro();
```

### React App

The core `App` component initializes the UI for the INTO-CPS Application, manages global states and handle the navigation.\
The `Bottom.tsx` component allows users to start/stop the Maestro engine, required to run a CoSimulation, using `CoSimulationApi`. The `CoSimulation.tsx` component displays simulation status and results path using the useCosimulation hook, which makes use of `CoSimulationApi`.\
Error handling is managed by `ErrorSnackbar.tsx`, which is being triggered and updated at each error captured, and displayed in a notification at the bottom of the screen.

#### Package Diagram

![Package Diagram React App](react_app_package.png)

#### Class Diagram

```mermaid
classDiagram
    %% App Component %%
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

    %% Sidebar Component %%
    class Sidebar {
        - isResponsive: boolean
        - manualOpen: boolean
        + handleResize(): void
        + handleToggle(): void
    }

    %% Bottom Component %%
    class Bottom {
        - maestroRunning: boolean
        + toggleMaestroState(): Promise<void>
    }

    %% ErrorSnackbar Component %%
    class ErrorSnackbar {
        - open: boolean
        - message: string
        - severity: 'info' | 'error' | 'warning' | 'success'
        + handleError(errorMessage: string): void
        + handleClose(): void
    }

    %% CoSimulation Component %%
    class CoSimulation {
        + error: string | null
        + simulationStatus: string
        + resultsPath: string | null
    }

    %% useCosimulation Hook %%
    class useCosimulation {
        - error: string | null
        - simulationStatus: string
        - resultsPath: string | null
        + handleStatusUpdate(event: unknown, status: string): Promise<void>
        + handleCoeError(event: unknown, errorMessage: string): void
        + handleCoeReset(): void
    }

    %% CosimulationAPI Interface %%
    class CosimulationAPI {
        + startMaestro(): Promise<void>
        + stopMaestro(): Promise<void>
        + startSimulation(): Promise<void>
        + onSimulationStatus(callback): void
        + removeSimulationStatusListener(callback): void
        + addCoeErrorListener(callback): void
        + removeCoeErrorListener(): void
        + getSessionId(): Promise<string | null>
        + getSimulationResult(sessionId: string): Promise<string>
    }

    %% Relationships %%
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

    %% 1. App Initialization %%
    User->>App: Open Application
    App->>Sidebar: mount()
    App->>Bottom: mount()
    App->>CoSimulation: mount()
    App->>ErrorSnackbar: mount()

    %% 2. Starting Maestro %%
    User->>Bottom: Click "Start CoE" Button (toggleMaestroState)
    Bottom->>CosimulationAPI: startMaestro()
    CosimulationAPI-->>Bottom: Maestro Started
    Bottom-->>CoSimulation: setSimulationStatus("Maestro Started")

    %% 3. Running Simulation %%
    User->>Sidebar: Click "CoSimulation" Navigation
    Sidebar-->>CoSimulation: Render Component
    User->>CoSimulation: Click "Run Simulation" Button
    CoSimulation->>CosimulationAPI: startSimulation()
    CosimulationAPI-->>CoSimulation: onSimulationStatus("Simulating...")
    CosimulationAPI-->>CoSimulation: onSimulationStatus("Simulation Completed")

    %% 4. Error Handling %%
    CosimulationAPI-->>ErrorSnackbar: addErrorListener(errorMessage)
    ErrorSnackbar-->>User: Display Error Notification (Snackbar)
```

### Maestro Management Model

The system is designed to manage the startup of Maestro server and the CoSimulation lifecycle through modular components:

- `MaestroManager`: Controls the CoSimulation lifecycle, allowing to start/stop Maestro, initialize, run and fetch the simulation results.
- `SimulationContext`: Stores and allow to retrieve the current simulation session ID.
- `CosimulationAPI`: Interfaces with MaestroManager to trigger simulation actions (currently focused on backend flow).
- `MaestroUtils`: Provides utilities for managing ports and external processes.
- `ErrorHandler`: Centralized error handling throughout the simulation process.
- `MenuManager`: Manages simulation-related UI state.

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
        + startMaestro(): Promise<void>
        + stopMaestro(): Promise<void>
        + startSimulation(): Promise<void>
        + getSimulationResult(sessionId: string): Promise<string>
        - extractMaestroJar(): void
        - sendSimulationStatus(status: string): void
    }

    %% Cosimulation API %%
    class CosimulationAPI {
        + startMaestro(): Promise<void>
        + stopMaestro(): Promise<void>
        + startSimulation(): Promise<void>
        + onSimulationStatus(callback): void
        + removeSimulationStatusListener(callback): void
        + addCoeErrorListener(callback): void
        + removeCoeErrorListener(): void
        + getConfig(): Promise<Object>
        + getSessionId(): Promise<string | null>
        + getSimulationResult(sessionId: string): Promise<string>
        + addCoeResetListener(callback): void
        + removeCoeResetListener(): void
    }

    %% Error Handler %%
    class ErrorHandler {
        + handleError(error: unknown): void
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


    %% Relazioni %%
    SimulationContext <|-- MaestroManager
    CosimulationAPI --> MaestroManager
    MaestroManager --> MaestroUtils
    MaestroManager --> ErrorHandler
    MaestroManager --> MenuManager
```

The following sequence diagram shows the internal workflow of the MaestroManager during the cosimulation process, covering the startup of the Maestro server, the CoSimulation execution, result handling, and error management

```mermaid
sequenceDiagram
    participant MM as MaestroManager
    participant MU as MaestroUtils
    participant EH as ErrorHandler
    participant MC as SimulationContext
    participant Menu as MenuManager

    %% Avvio di Maestro %%
    MM->>MU: isPortInUse(MAESTRO_PORT)
    MU-->>MM: Port status
    MM->>MU: killProcessOnPort(MAESTRO_PORT) (if needed)
    MM->>MM: extractMaestroJar()
    MM->>MM: spawn Maestro JAR
    MM->>Menu: updateCosimulationMenu(true)

    %% Maestro avviato correttamente %%
    MM->>MM: sendSimulationStatus("Maestro Started")

    %% Avvio della Simulazione %%
    MM->>MM: load experiment.json, multi-model.json
    MM->>MU: resolve FMUs paths
    MM->>MM: fetch(`${MAESTRO_BASE_URL}/createSession`)
    MM->>MC: setSessionId(sessionId)
    MM->>MM: sendSimulationStatus("Simulation Initialized")

    %% Esecuzione della Simulazione %%
    MM->>MM: fetch(`${MAESTRO_BASE_URL}/simulate`)
    MM->>MM: sendSimulationStatus("Simulating...")

    %% Completamento della Simulazione %%
    MM->>MM: sendSimulationStatus("Simulation Completed")

    %% Recupero dei Risultati %%
    MM->>MM: fetch(`${MAESTRO_BASE_URL}/result/${sessionId}`)
    MM->>MM: save CSV to outputPath

    %% Gestione degli Errori %%
    MM->>EH: handleError(error)

```

### Maestro Model and React communication using IPC

This squence diagram illustrates the interaction between the Maestro Model and the Electron IPC system for managing the CoSimulation process. The process involves starting the maestro server from the `Bottom` bar and running the CosSmulation from the application menu, result handling, and error management.

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
    Bottom->>IPC: invoke('start-maestro')
    IPC->>MM: startMaestro()
    MM->>MU: isPortInUse(MAESTRO_PORT)
    MU-->>MM: Port status
    MM->>MU: killProcessOnPort(MAESTRO_PORT) (if needed)
    MM->>MM: extractMaestroJar()
    MM->>MM: spawn Maestro JAR
    MM->>MenuManager: updateCosimulationMenu(true)
    MM->>IPC: emit('simulation-status-update', "Maestro Started")

    %% 2. Bottom.tsx Receives Status Update %%
    IPC->>Bottom: simulation-status("Maestro Started")

    %% 3. Starting Simulation from Electron Menu %%
    Menu->>IPC: emit('start-simulation')
    IPC->>MM: startSimulation()
    MM->>MM: load experiment.json, multi-model.json
    MM->>MU: resolve FMUs paths
    MM->>MM: fetch('/createSession')
    MM->>MC: setSessionId(sessionId)
    MM->>IPC: emit('simulation-status-update', "Simulation Initialized")

    %% 4. Bottom.tsx Receives Simulation Status %%
    IPC->>Bottom: simulation-status("Simulation Initialized")

    %% 5. Running Simulation %%
    MM->>MM: fetch('/simulate')
    MM->>IPC: emit('simulation-status-update', "Simulating...")
    IPC->>Bottom: simulation-status("Simulating...")

    %% 6. Simulation Completion %%
    MM->>IPC: emit('simulation-status-update', "Simulation Completed")
    IPC->>Bottom: simulation-status("Simulation Completed")

    %% 7. Fetching Results %%
    Bottom->>IPC: invoke('get-simulation-result', sessionId)
    IPC->>MM: getSimulationResult(sessionId)
    MM->>MM: fetch('/result/{sessionId}')
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

The interaction between the React frontend and the Electron logic is being managed through IPC. \
When a user interacts with the application, the React frontend calls methods exposed through `window.cosimulationAPI`. This API works as a secure bridge between the frontend and the Electron logic. \
For instance, invoking `startMaestro()` from the frontend (`Bottom`) triggers `start-maestro`, an event handled by `ipcMain` in the main Electron process. The `startMaestro` function is then executed by the backend, initiating the Maestro process.
The user interface receives real-time feedback thanks to the emitted statuses from the backend, like `simulation-status-update`, captured by the hook `useCosimulation`, which updates the UI.

```mermaid
sequenceDiagram
    participant User as User
    participant Bottom as Bottom.tsx (React)
    participant CosimAPI as window.cosimulationAPI (IPC Renderer)
    participant IPCMain as ipcMain (Electron Main)
    participant Maestro as MaestroManager (Backend Process)
    participant ErrorHandler as ErrorHandler
    participant Snackbar as ErrorSnackbar (React)

    %% 1. User Starts Maestro %%
    User->>Bottom: Click "Start CoE" Button
    Bottom->>CosimAPI: startMaestro()
    CosimAPI->>IPCMain: invoke('start-maestro')
    IPCMain->>Maestro: startMaestro()
    Maestro-->>IPCMain: emit('simulation-status-update', "Maestro Started")
    IPCMain-->>CosimAPI: simulation-status-update("Maestro Started")
    CosimAPI-->>Bottom: Update UI (Status: "Maestro Started")

    %% 2. Running Simulation %%
    User->>Bottom: Click "Start Simulation" Button
    Bottom->>CosimAPI: startSimulation()
    CosimAPI->>IPCMain: invoke('start-simulation')
    IPCMain->>Maestro: startSimulation()
    Maestro-->>IPCMain: emit('simulation-status-update', "Simulating...")
    IPCMain-->>CosimAPI: simulation-status-update("Simulating...")
    CosimAPI-->>Bottom: Update UI (Status: "Simulating...")

    %% 3. Simulation Completed %%
    Maestro-->>IPCMain: emit('simulation-status-update', "Simulation Completed")
    IPCMain-->>CosimAPI: simulation-status-update("Simulation Completed")
    CosimAPI-->>Bottom: Update UI (Status: "Simulation Completed")

    %% 4. Error Handling %%
    Maestro-->>ErrorHandler: handleError(error)
    ErrorHandler->>IPCMain: emit('show-error', errorMessage)
    IPCMain-->>CosimAPI: show-error(errorMessage)
    CosimAPI-->>Snackbar: Display Error Snackbar
    Snackbar-->>User: Show Error Notification
```
