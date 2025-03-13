import MCR, { CoverageReportOptions } from 'monocart-coverage-reports';

const coverageOptions: CoverageReportOptions = {
  name: 'Playwright Monocart Coverage Reports',
  reports: ['html', 'json', 'lcov', 'console-details'],

  sourceFilter: (sourceName: string) => {
    const isFromNodeModules = sourceName.includes("node_modules"); 
    const isTypeScript = sourceName.endsWith(".ts") || sourceName.endsWith(".tsx");
    return !isFromNodeModules && isTypeScript;
  },

  entryFilter: (entry: MCR.V8CoverageEntry) => {
    return !entry.url.includes("node_modules") && entry.url.endsWith(".tsx");
  },

  outputDir: './coverage/e2e',
};

export default coverageOptions;