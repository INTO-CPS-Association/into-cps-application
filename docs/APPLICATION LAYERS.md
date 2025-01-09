# Overview
This documentaion outlines the key concepts and interaction between the different technologies used to develop the INTO-CPS Application, as well as the logic and the model management.

# Key components

## Electron

Electron is a framework for building desktop applications using JavaScript, HTML, and CSS. By embedding Chromium and Node.js into its binary, Electron allows you to maintain one JavaScript codebase and create cross-platform apps that work on Windows, macOS, and Linux — no native development experience required.[1](https://www.electronjs.org/docs/latest/)

### BrowserWindow

[BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window) is a class used to create and manage application windows, displaying HTML, CSS and Javascript content. The class BrowserWindow exposes many API for [Window Customization](https://www.electronjs.org/docs/latest/tutorial/window-customization).\
Each BrowserWindows instance is rendered in its own renderer process, operating differently from the main process.

Example of creation of the main window of the application:
```
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

### Processes model and  Context management
Electron applications operate with two types of processes:
- Main Process: This manages the whole lifespan of the application, acting as the application's entry point. It runs on a Node.js environment, thus having the ability to use `require`.  This can create windows and interact with the operative system with native APIs. [2](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process)
- Renderer Process: Each `BrowserWindow` runs in its own renderer process, responsible for rendering web content (the UI of the application). The renderer has no direct access to Node.js APIs and Electron's native desktop functionality

To securely share information between the main and renderer processes through [**Preload Scripts**](https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts) and [**IPC**](https://www.electronjs.org/docs/latest/tutorial/ipc).

#### Preload Scripts

The preload script bridges the main process and the renderer process in a secure manner. It runs in a context that has access to both Node.js and the DOM but does not expose the full Node.js API to the renderer, preventing vulnerabilities for malicious attacks.

Example of `preload.js`:
```
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  startMaestro: () => ipcRenderer.invoke('start-maestro')
});
```

#### Inter-Process Communication
Electron provides IPC for communication between the main process and renderer processes. IPC helps manage the context by sending and receiving messages, allowing synchronized application states. IPC is the only way to perform many common tasks, such as calling a native API from the UI or triggering changes in the web contents from native menus.
Processes communicate by passing messages through `ipcMain` and `ipcRenderer` modules.

Example of IPC usage:

*main process*
```
ipcMain.handle('start-maestro', startMaestro);
```

*renderer process*
```
window?.cosimulationAPI?.startMaestro();
```
