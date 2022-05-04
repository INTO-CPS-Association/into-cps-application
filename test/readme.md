Playwright testing
---

Spectron testing for electron apps is deprected. Onwards we are utilizing [Playwright](https://playwright.dev/docs/intro) as testing framework and use the Electron API to access the INTO-CPS application frontend.

##### Environment variables

* PWDEBUG - Launches debug mode and start the inspection window

```bash
PWDEBUG=1 npm test default.spec.ts
```
#### Run single test file

```bash
npm test default.spec.ts
```

#### Test all
```bash
npm test
```
