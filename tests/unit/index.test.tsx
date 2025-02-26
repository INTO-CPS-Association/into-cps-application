import { createRoot } from "react-dom/client";

jest.mock("react-dom/client", () => {
  const mockRender = jest.fn();
  return {
    createRoot: jest.fn(() => ({ render: mockRender })),
  };
});

jest.mock("../../src/App", () => require("../__mocks__/App").default);

describe("index.tsx", () => {
  it("renders the App component inside React.StrictMode", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app") as HTMLDivElement;

    require("../../src/index");

    expect(createRoot).toHaveBeenCalledWith(container);
    expect((createRoot as jest.Mock).mock.results[0].value.render).toHaveBeenCalled();
  });
});