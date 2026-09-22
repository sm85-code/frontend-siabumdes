// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { House } from "./icons.jsx";
import { ThemeProvider, useTheme } from "./lib/theme.jsx";

function Probe({ theme }) {
  const { setTheme } = useTheme();
  useEffect(() => setTheme(theme), [theme, setTheme]);
  return <House data-testid="icon" />;
}

function renderWithTheme(theme) {
  return render(
    <ThemeProvider>
      <Probe theme={theme} />
    </ThemeProvider>,
  );
}

describe("themed icons", () => {
  it("renders the Lucide (thin outline) icon for the modern theme", () => {
    const { getByTestId } = renderWithTheme("modern");
    expect(getByTestId("icon").getAttribute("class")).toMatch(/lucide/);
  });

  it("renders the real Phosphor icon (not Lucide) for classic and playful themes", () => {
    for (const theme of ["classic", "playful"]) {
      const { container, unmount } = renderWithTheme(theme);
      const svg = container.querySelector('[data-testid="icon"]');
      expect(svg.getAttribute("class") || "").not.toMatch(/lucide/);
      unmount();
    }
  });
});
