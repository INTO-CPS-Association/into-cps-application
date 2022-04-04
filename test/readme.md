Playwright testing
---

Spectron testing for electorn apps is deprected. Onwards we are utilizing [Playwright](https://playwright.dev/docs/intro) as testing framework and use the Electron API to access the INTO-CPS application frontend.

## Commands

##### Debug
```bash
PWDEBUG=1 npm test default.spec.ts
```
#### Local test

CI is running tests in parallel, but if tests need to be run locally it might be easier to run tests in serial using one worker.

```bash
npm test default.spec.ts --workers 1
```

#### Test all
```bash
npm test
```