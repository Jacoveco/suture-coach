import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURE_IMAGE = path.join(
  __dirname,
  "..",
  "tests",
  "fixtures",
  "images",
  "synthetic-suture-sample.jpg",
);

test.describe("upload -> analyze -> feedback -> visualization", () => {
  test("uploading a photo renders feedback and an overlay annotation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Suture Coach" })).toBeVisible();
    await expect(page.getByText("Take Photo / Video")).toBeVisible();
    await expect(page.getByText("Choose from Library")).toBeVisible();

    const libraryInput = page.getByLabel("Choose a photo or video from your library");
    await libraryInput.setInputFiles(FIXTURE_IMAGE);

    await expect(page.getByRole("status")).toHaveText(/Analyzing/);

    await expect(page.getByText("Loosen the middle stitches")).toBeVisible({
      timeout: 15_000,
    });

    // At least one overlay annotation rendered, accessibly labeled with its note.
    await expect(
      page.getByRole("img", { name: "Tissue is bunching — tension is too high here." }),
    ).toBeVisible();

    // Recommendations are non-empty and the disclaimer is visible.
    await expect(page.getByText("Even out stitch spacing near the midpoint")).toBeVisible();
    await expect(page.getByText(/training purposes on simulated\/practice material only/)).toBeVisible();
  });

  test("shows an inline error for an unsupported file type", async ({ page }) => {
    await page.goto("/");

    const libraryInput = page.getByLabel("Choose a photo or video from your library");
    await libraryInput.setInputFiles({
      name: "notes.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a real pdf"),
    });

    // Scope past Next.js's own dev-mode route-announcer, which also carries
    // role="alert" (id="__next-route-announcer__") — match our own error
    // text directly rather than by role alone.
    await expect(page.getByText(/isn't supported/)).toBeVisible();
  });
});
