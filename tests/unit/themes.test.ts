import { lightTheme, darkTheme } from "../../src/themes";

describe("Themes", () => {
  it("should define light theme correctly", () => {
    expect(lightTheme.palette.mode).toBe("light");
  });

  it("should define dark theme correctly", () => {
    expect(darkTheme.palette.mode).toBe("dark");
  });
});