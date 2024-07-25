# Webshot
Add bounding boxes, arrows, masks and text to screenshots of webpages.

![](./test/screenshot.png)

## Installation
```bash
npm i playwright-webshot
```

## Usage

Add borders, arrows and mask to target elements on a webpage.

```javascript
// test.ts 
import { test, expect } from "@playwright/test";
import { webshot } from "playwright-webshot";


test("Paint Webshot", async ({ page }) => {
  await page.goto("https://playwright.dev");

  const locator = page.getByText(/get started/i).first();

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
  
  await page.close();
});

```

```bash
npx playwright test test.ts
```

#### Contributions are welcome! 🎉

## License
MIT


## Contact me
- [Twitter](https://twitter.com/int2float)
- [Email](mailto:mail2paras.s@gmail.com)
