// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary.jsx";

function Bomb() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // React logs the caught error to console.error too; suppress noise for this test.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children normally when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Konten aman</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Konten aman")).toBeTruthy();
  });

  it("catches a thrown render error and shows the fallback UI instead of crashing", () => {
    expect(() =>
      render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      ),
    ).not.toThrow();

    expect(screen.getByText("Terjadi kesalahan tak terduga")).toBeTruthy();
    expect(screen.getByText("Muat Ulang")).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("supports a custom fallback via the fallback prop", () => {
    render(
      <ErrorBoundary fallback={<div>Fallback kustom</div>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Fallback kustom")).toBeTruthy();
  });
});
