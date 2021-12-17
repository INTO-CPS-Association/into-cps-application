import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Reactivity, SigverConfiguration } from "../../intocps-configurations/sigver-configuration";
import * as fs from "fs";

@Injectable()
export class SigverConfigurationService {
	private _configuration: SigverConfiguration = new SigverConfiguration();
	private _configurationChanged = new Subject<boolean>();
	private _configurationLoaded = new Subject<boolean>();

	public configurationChangedObservable = this._configurationChanged.asObservable();
	public configurationLoadedObservable = this._configurationLoaded.asObservable();
	public configurationPath: string;
	public automaticallySaveOnChanges: boolean = true;
	public isDefaultConfiguration: boolean = true;

	public set configuration(sigverConfiguration: SigverConfiguration) {
		// Search for changes that invalidates the masterModel
		let resetMasterModel: boolean = false;
		if (sigverConfiguration.masterModel != "") {
			for (const entry of Array.from(this._configuration.reactivity.entries())) {
				if (!sigverConfiguration.reactivity.has(entry[0]) || sigverConfiguration.reactivity.get(entry[0]) != entry[1]) {
					resetMasterModel = true;
					break;
				}
			}
		}
		this._configuration = sigverConfiguration;
		this.isDefaultConfiguration = this._configuration.experimentPath == "";
		if (resetMasterModel) {
			this._configuration.masterModel = "";
		}

		this.configurationChanged();
	}

	public get configuration(): SigverConfiguration {
		return this._configuration;
	}

	loadConfigurationFromPath(path: string = ""): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let filePath = path == "" ? this.configurationPath : path;
			fs.readFile(filePath, (fileErr, fileData) => {
				if (fileErr) {
					reject(`Unable to read configuration file from: ${filePath} due to: ${fileErr}`);
				}
				SigverConfiguration.parse(JSON.parse(fileData.toString()))
					.then((res) => {
						this.configuration = res;
						this.configurationLoaded();
						resolve();
					})
					.catch((err) => {
						reject(`Unable to set configuration from file: ${filePath} due to: ${err}`);
					});
			});
		});
	}

	configurationChanged() {
		this._configurationChanged.next(true);
	}

	saveConfiguration(path: string = ""): boolean {
		try {
			fs.writeFileSync(path == "" ? this.configurationPath : path, JSON.stringify(this._configuration.toObject()));
			fs.writeFileSync(this.configuration.coePath, JSON.stringify(this._configuration.coeConfig.toObject()));
		} catch (err) {
			console.error(`Unable to write configuration to file: ${err}`);
			return false;
		}
		return true;
	}

	configurationToExtendedMultiModelDTO(verify: boolean = false): any {
		const extendedMultiModelDTO = this._configuration.coeConfig.multiModel.toObject();
		let fmus: any = {};
		this._configuration.coeConfig.multiModel.fmus.forEach((fmu) => {
			let fmuPath;
			if (fmu.isNested()) {
				fmuPath = "coe:/" + fmu.path;
			} else {
				fmuPath = "file:///" + fmu.path;
			}
			fmus[fmu.name] = fmuPath.replace(/\\/g, "/").replace(/ /g, "%20");
		});
		extendedMultiModelDTO["fmus"] = fmus;

		const reactivity: { [key: string]: Reactivity } = {};
		this._configuration.reactivity.forEach((value: Reactivity, key: string) => (reactivity[key] = value));

		const scenarioVerifierDTO: any = {};
		scenarioVerifierDTO[SigverConfiguration.REACTIVITY_TAG] = reactivity;
		scenarioVerifierDTO["verification"] = verify;
		scenarioVerifierDTO["traceVisualization"] = false;

		extendedMultiModelDTO["sigver"] = scenarioVerifierDTO;

		return extendedMultiModelDTO;
	}

	private configurationLoaded() {
		this._configurationLoaded.next(true);
	}
}
