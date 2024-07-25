import { test, expect } from "@playwright/test";
import { webshot } from "../src";

test("Paint Webshot", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const locator = page.getByText(/started/i).first();
  const screenshot = await webshot(
    page,
    [
      {
        locator,
        type: "box",
        box: {
          border: {
            width: 2,
            color: "red",
          },
        },
      },
      {
        locator,
        type: "arrow",
        arrow: {
          direction: "down",
          color: "green",
          width: 50,
          height: 2,
          offset: 30,
        },
      },
      {
        locator,
        type: "arrow",
        arrow: {
          direction: "right",
          color: "red",
          width: 50,
          height: 2,
          offset: 30,
        },
      },
      {
        locator,
        type: "arrow",
        arrow: {
          direction: "left",
          color: "red",
          width: 50,
          height: 2,
          offset: 30,
        },
      },
      {
        locator,
        type: "arrow",
        arrow: {
          direction: "up",
          color: "red",
          width: 50,
          height: 2,
          offset: 30,
        },
      },
      {
        locator: page
          .getByText(
            /Playwright enables reliable end-to-end testing for modern web apps./i
          )
          .first(),
        type: "mask",
        mask: {
          color: "transparent",
          blur: 10,
        },
      },
    ],
    {
      path: "test/screenshot.png",
    }
  );

  expect(screenshot).toMatchSnapshot();

  await page.close();
});
