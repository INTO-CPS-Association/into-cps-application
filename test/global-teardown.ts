import MCR from 'monocart-coverage-reports';
import coverageOptions from '../mcr.config';
import { type FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    console.log("Generating coverage report...");
    const mcr = MCR(coverageOptions);
    await mcr.generate();
    console.log("Coverage report generated.");
}

export default globalTeardown;