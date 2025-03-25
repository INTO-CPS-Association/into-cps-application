# User Guide

Welcome to the **INTO-CPS Application** User Guide.\
This guide provides step-by-step instructions to configure and run a Co-Simulation using the Maestro Engine.\
The guide is structured as follow:

- [Required dependencies](#required-dependencies): Necessary requirements to run Maestro.
- [Project configuration](#project-configuration): Correct project directory configuration before launching Maestro and running a simulation.
- [Application overview](#application-overview): Understand the main components of the interface and the application's functionalities.
- [Using the Application](#using-the-application): How to select a project, start the engine, run a simulation, retrieve the results, and stop Maestro.
- [Troubleshooting](#troubleshooting): Solutions to common issues.

## Required dependencies

You need to ensure that Java is installed in your system in order to use the application:

- Java (SE Runtime):
  - Windows
  - Linux

### Project configuration

To start the Maestro Co-Simulation Engine, a proper Co-Simulation project has to be configured.\
It is necessary to have a folder with the following structure:

```plaintext
FMUs/
  FMU1
  FMU2
  ...

cosimulation/
  default/ (plain co-simulation config with separate multi-models and experiment configurations)
    multi-model.json
    experiment.json

results/
  cosimulation (same structure as top-level cosimulation, according to your cosimulation project)
```

## Application overview

After launching the application, the application opens to the main page.\
The application consists of four main parts: the main content area, the sidebar, the bottom bar and the top menu.

!["application main page"](./media/user-guide_1.png)

### Features

- Toggle Dark Mode
- Toggle Developer Mode
- Select Co-Simulation project
- Co-Simulation:
  - Launch Maestro Co-Simulation Engine on selected project
  - Run Co-Simulation
  - Retrieve the Co-Simulation results
  - Stop Maestro Co-Simulation Engine

## Using the Application

### Selecting a project

To run Maestro, a Co-Simulation project is required:

- Click on "File" → "Choose Project" from the top menu.
- A dialog box will appear. Select the folder containing your project and confirm.
- The application will load the selected project and enable the co-simulation menu.
Please be sure to have the exact same project folder structure described before.

### Starting the Maestro Co-Simulation Engine

- Navigate to the Sidebar and change the page to Cosimulation.
- Navigate to the Bottom bar.
- Click the "Start CoE" button.
- A new Maestro process will be launched and you will see updates on the status of Maestro.
  - "Starting Maestro..."
  - "Maestro Started Successfully
- Please note that if an existing Maestro instance is found open, it will be shut down and a new one will be launched.
- If errors occur, they will be shown in the error snackbar at the bottom right.

### Running the Co-Simulation

- Click "Start Simulation" in the top menu under "CoSimulation"
- The application will:
  - Load the project, including the experiment and multi-model configurations.
  - Resolve the paths for FMUs and initialize the session.
  - Display the simulation statuses updates:
    - "Simulation Initialized"
    - "Simulating..."
  - If errors occur, they will be shown in the error snackbar at the bottom right.

Note: If you try to run a simulation while another one is still in progress, the application will block the request and show a warning. This prevents unexpected behavior or data corruption.

### Retrieving the results

- Once the simulation is completed, the results will be saved.
- The CoSimulation page will show:
  - Simulation status "Simulation Completed"
  - The path of the folder containing your results
- If errors occur, they will be shown in the error snackbar at the bottom right.

### Simulation Logs and Timestamps

Each simulation automatically generates a dedicated log file under:

```plaintext
results/cosimulation/default/logs
```

Files are named with a readable timestamp, e.g. `CoSimulation-2025-03-22_12-35-10.log`.

Logs include simulation steps, errors, and result statuses. If the log file is deleted during runtime, the app will detect this and notify the user, but the CoSimulation will keep running. To generate again a Maestro or CoSimulation log, restart Maestro or run another CoSimulation.

### Stopping the Maestro Engine

- To stop the Maestro process, click "Stop CoE" in the bottom bar.
- The system will:
  - Shut down the engine
  - Reset the Co-Simulation session
  - Update the UI status

## Troubleshooting

- Maestro doesn't start?\
  Maestro is automatically installed with the application and the only dependency needed is Java. Ensure that Java is installed and properly configured, then restart the application.
