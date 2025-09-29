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

You need to ensure that Java is installed in your system in order to use the application. At the current state, Java 8.x.x or Java 11.x.x are required to properly use Maestro.\
To manage different versions of Java on Linux, `update-alternatives` is recommended, as other tools like `SDKMan` may configure the Java path only in the shell environment and can lead to issues when launching `.AppImage` GUIs without a terminal.

```bash
sudo update-alternatives --install /usr/bin/java java /usr/lib/jvm/java-11-openjdk-amd64/bin/java 1
sudo update-alternatives --set java /usr/lib/jvm/java-11-openjdk-amd64/bin/java
```

### Project configuration

To run a Co-Simulation, a proper Co-Simulation project has to be configured.\
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
The application consists of three main parts: the main content area, the sidebar and the top menu.

!["application main page"](./media/user-guide_1.png)

### Features

- Toggle Dark Mode
- Toggle Developer Mode
- Select Co-Simulation project
- Co-Simulation:
  - Run Co-Simulation
  - Watch the graph plotted for the Co-Simulation
  - Retrieve the Co-Simulation resultss

## Using the Application

### Selecting a project

To run a Co-Simulation, a Co-Simulation project is required:

- Click on "File" → "Choose Project" from the top menu.
- A dialog box will appear. Select the folder containing your project and confirm.
- The application will load the selected project and enable the co-simulation menu.
Please be sure to have the exact same project folder structure described before.

### Running the Co-Simulation

- To read Co-Simulation updates, change page and navigate to "CoSimulation".
- Click "Start Simulation" in the top menu under "CoSimulation".
- The application will:
  - Load the project, including the experiment and multi-model configurations.
  - Resolve the paths for FMUs and initialize the session.
  - Display the simulation statuses updates:
    - "Simulation Initialized"
    - "Simulating..."
  - If errors occur, they will be shown in the error snackbar at the bottom right.

### Reading the graph

When a Co-Simulation is launched, a new windows gets opened where a live graph of the Co-Simulation gets plotted.
!["graph window"](./media/user-guide_2.png)

The variables involved during the Co-Simulation gets shown on the graph, and their values can be read at any instant of the simulated time:
!["graph window"](./media/user-guide_3.png)

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

Logs include simulation steps, errors, and result statuses. If the log file is deleted during runtime, the app will detect this and notify the user, but the CoSimulation will keep running. To generate again a CoSimulation log, run another CoSimulation.

## Troubleshooting

- The Co-Simulation doesn't start?\
  Maestro is automatically installed with the application and the only dependency needed is Java. Ensure that Java is installed and properly configured, then restart the application.
- The Co-Simulation gets stuck at `Starting Maestro`? Check if you are using the correct Java version.
