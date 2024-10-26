import { CoverageReportOptions} from "monocart-coverage-reports"

// https://github.com/cenfun/monocart-coverage-reports
const coverageOptions: CoverageReportOptions = {

    name: 'Coverage Report',

    reports: [
        'console-details',
        'v8',
        "lcovonly"
    ],

    entryFilter: {
        '**/node_modules/**': false,
        '**/dist/**': false,
        'src/**/*.ts': true,
        'src/**/*.js': true
    },
    sourceFilter: {
        '**/node_modules/**': false,
        '**/dist/**': false,
        'src/**/*.ts': true,
        'src/**/*.js': true 
    },

    outputDir: 'test/coverage-reports'
}

export default coverageOptions