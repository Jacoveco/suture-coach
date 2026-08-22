import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's automatic afterEach(cleanup) only registers when it detects global
// test hooks; since we import `afterEach` explicitly rather than using
// vitest's globals, wire cleanup up here so components unmount between tests.
afterEach(() => {
  cleanup();
});
