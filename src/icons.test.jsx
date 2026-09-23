// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { House } from "./icons.jsx";

describe("icons", () => {
  it("renders as a Lucide SVG", () => {
    const { getByTestId } = render(<House data-testid="icon" />);
    expect(getByTestId("icon").getAttribute("class")).toMatch(/lucide/);
  });
});
