import {
  type PageScreenshotOptions,
  type Locator,
  type Page,
  chromium,
} from "@playwright/test";
import { URL } from "url";
import { getBrowserFrameConfig } from "./frames";

export interface BoxConfig {
  border?: {
    width: number;
    color: string;
  };
  radius?: number;
  background?: string;
  padding?: number;
}
export interface ArrowConfig {
  direction: "left" | "right" | "up" | "down";
  color: string;
  width?: number;
  height?: number;
  offset?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  textBgColor?: string;
}

export interface TextConfig {
  content: string;
  color: string;
  fontSize?: number;
  backgroundColor?: string;
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
}

export interface MaskConfig {
  color: string;
  blur: number;
}

export interface PaintConfig {
  locator: Locator;
  type: "box" | "arrow" | "mask" | "text" | string;
  mask?: MaskConfig;
  box?: BoxConfig;
  arrow?: ArrowConfig;
  text?: TextConfig;
}

interface Relic extends PaintConfig {
  id: string;
}

const addArrowCss = (color: string) => {
  // generate random class name
  const className = `arrow-${Math.random().toString(36).substring(7)}`;

  const css = `
        .${className}::before {
            content: '';
            position: absolute;
            top: 50%;
            right: -20px;
            margin-top: -10px;
            width: 0;
            height: 0;
            border-left: 20px solid ${color};
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;
        }
`;

  return { className, css };
};

export interface WebshotOptions extends PageScreenshotOptions {
  showBrowserFrame?: boolean;
  darkMode?: boolean;
  browserFrameType?: "mac" | "chrome";
}

export const webshot = async (
  page: Page,
  configs: PaintConfig[],
  options?: WebshotOptions
) => {
  const allRelics: Relic[] = [];
  await Promise.all(
    configs.map(async (paintConfig) => {
      const { locator } = paintConfig;

      const locatorId = `s${Math.random().toString(36).substring(7)}`;

      if (!locator) {
        throw new Error(
          `Could not find element with selector: ${paintConfig.locator}`
        );
      }
      const { box, arrow } = paintConfig;

      if (paintConfig.type === "box") {
        await locator.evaluate(
          (element, { box, locatorId }) => {
            const elemRect = element.getBoundingClientRect();
            const boxElement = document.createElement("div");

            boxElement.id = locatorId;

            const padding = box?.padding || 0;

            boxElement.style.position = "absolute";
            boxElement.style.top = `${-padding}px`;
            boxElement.style.left = `${-padding}px`;

            boxElement.style.bottom = "auto";
            boxElement.style.right = "auto";
            boxElement.style.width = `${elemRect.width + 2 * padding}px`;
            boxElement.style.height = `${elemRect.height + 2 * padding}px`;

            boxElement.style.zIndex = "9999";

            boxElement.style.borderColor = box?.border?.color || "transparent";
            boxElement.style.borderWidth = `${box?.border?.width || 0}px`;
            boxElement.style.borderStyle = "solid";

            boxElement.style.borderRadius = `${box?.radius || 0}px`;

            boxElement.style.background = box?.background || "transparent";

            element.style.position = "relative";
            element.appendChild(boxElement);
          },
          { box, locatorId }
        );
      }

      if (arrow) {
        // add arrow css
        const { className, css } = addArrowCss(arrow.color);

        // inject css to the page
        await page.addStyleTag({
          content: css,
        });
        await locator.evaluate(
          (element, { arrow, className, locatorId }) => {
            const arrowElement = document.createElement("div");

            arrowElement.id = locatorId;

            arrowElement.classList.add(className);

            arrowElement.style.backgroundColor = arrow.color;
            arrowElement.style.width = `${arrow.width || 100}px`;
            arrowElement.style.height = `${arrow.height || 10}px`;

            arrowElement.style.zIndex = "9999";

            arrowElement.style.position = "fixed";

            const targetRect = element.getBoundingClientRect();
            const arrowWidth = arrow.width || 100;
            const arrowHeight = arrow.height || 10;
            const arrowOffset = arrow.offset || 20;

            switch (arrow.direction) {
              case "left":
                arrowElement.style.left = `${
                  targetRect.left - arrowWidth - arrowOffset
                }px`;
                arrowElement.style.top = `${
                  targetRect.top + targetRect.height / 2 - arrowHeight / 2
                }px`;
                break;
              case "right":
                arrowElement.style.left = `${targetRect.right + arrowOffset}px`;
                arrowElement.style.top = `${
                  targetRect.top + targetRect.height / 2 - arrowHeight / 2
                }px`;
                // flip the arrow
                arrowElement.style.transform = "rotate(180deg)";
                break;
              case "up":
                arrowElement.style.left = `${
                  targetRect.left + targetRect.width / 2 - arrowWidth / 2
                }px`;
                arrowElement.style.top = `${
                  targetRect.top - arrowOffset - arrowWidth / 2
                }px`;

                arrowElement.style.transform = "rotate(90deg)";

                break;
              case "down":
                arrowElement.style.left = `${
                  targetRect.left + targetRect.width / 2 - arrowWidth / 2
                }px`;
                arrowElement.style.top = `${
                  targetRect.bottom + arrowWidth / 2 + arrowOffset
                }px`;
                arrowElement.style.transform = "rotate(270deg)";

                break;
            }

            // insert arrow element to the body
            document.body.appendChild(arrowElement);

            // add text at the end of the arrow
            if (arrow.text) {
              // calculate text position using getBoundingClientRect of arrow
              const textElement = document.createElement("div");

              textElement.id = `${locatorId}-text`;

              const arrowRect = arrowElement.getBoundingClientRect();

              textElement.style.position = "fixed";

              document.body.appendChild(textElement);

              textElement.innerHTML = arrow.text;

              textElement.style.color = arrow.textColor || "black";

              textElement.style.zIndex = "99999";

              textElement.style.fontSize = `${arrow.fontSize}px`;

              textElement.style.background = arrow.textBgColor || "transparent";

              textElement.style.padding = "4px";

              textElement.style.lineHeight = "1";

              const textRect = textElement.getBoundingClientRect();

              const defaultTextOffset = 10;

              switch (arrow.direction) {
                case "left":
                  textElement.style.left = `${
                    arrowRect.left - textRect.width - defaultTextOffset
                  }px`;
                  textElement.style.top = `${
                    arrowRect.top - textRect.height / 2
                  }px`;
                  break;
                case "right":
                  textElement.style.left = `${
                    arrowRect.right + defaultTextOffset
                  }px`;
                  textElement.style.top = `${
                    arrowRect.top - textRect.height / 2
                  }px`;
                  break;
                case "up":
                  textElement.style.left = `${
                    arrowRect.left - textRect.width / 2
                  }px`;
                  textElement.style.top = `${
                    arrowRect.top - textRect.height - defaultTextOffset
                  }px`;
                  break;

                case "down":
                  textElement.style.left = `${
                    arrowRect.left - textRect.width / 2
                  }px`;
                  textElement.style.top = `${
                    arrowRect.bottom + defaultTextOffset
                  }px`;
                  break;
              }
            }
          },
          { arrow, className, locatorId }
        );
      }

      if (paintConfig.type === "mask") {
        if (!paintConfig.mask) {
          throw new Error("Mask config is required");
        }
        await locator.evaluate(
          (element, { mask, locatorId }) => {
            const maskElement = document.createElement("div");

            maskElement.id = locatorId;
            maskElement.style.position = "absolute";
            maskElement.style.top = "0";
            maskElement.style.left = "0";
            maskElement.style.width = "100%";
            maskElement.style.height = "100%";
            maskElement.style.zIndex = "9999";
            maskElement.style.backgroundColor = mask.color;
            maskElement.style.backdropFilter = `blur(${mask.blur || 0}px)`;

            element.style.position = "relative";
            element.appendChild(maskElement);
          },
          { mask: paintConfig.mask, locatorId }
        );
      }

      if (paintConfig.type === "text") {
        if (!paintConfig.text) {
          throw new Error("Text config is required");
        }
        await locator.evaluate(
          (element, { text, locatorId }) => {
            const textElement = document.createElement("div");

            textElement.id = locatorId;
            textElement.style.position = "fixed";
            textElement.style.top = text.top || "none";
            textElement.style.left = text.left || "none";
            textElement.style.right = text.right || "none";
            textElement.style.bottom = text.bottom || "none";

            textElement.style.zIndex = "9999";
            textElement.style.color = text.color || "black";
            textElement.style.fontSize = `${text.fontSize}px`;
            textElement.style.background =
              text.backgroundColor || "transparent";
            textElement.style.padding = "2px";
            textElement.style.lineHeight = "1";

            textElement.style.textAlign = "center";

            textElement.innerHTML = text.content;

            // append text element to the body
            document.body.appendChild(textElement);
          },
          { text: paintConfig.text, locatorId }
        );
      }

      allRelics.push({
        id: locatorId,
        ...paintConfig,
      });
    })
  );

  let screenshot = await captureShot(page, options);

  return {
    screenshot,
    relics: allRelics,
    page: page,
    options: options,
    retake: async function () {
      return captureShot(this.page, { ...this.options, path: undefined });
    },
    reset: async function () {
      await Promise.all(
        this.relics.map(async (relic) => {
          await this.page.evaluate(
            ({ relicId, type }) => {
              const element = document.getElementById(relicId);

              if (element) {
                element.remove();
              }

              if (type === "arrow") {
                const textElement = document.getElementById(`${relicId}-text`);

                if (textElement) {
                  textElement.remove();
                }
              }
            },
            { relicId: relic.id, type: relic.type }
          );
        })
      );
    },
  };
};

const captureShot = async (page: Page, options?: WebshotOptions) => {
  if (options?.showBrowserFrame) {
    const browser = await chromium.launch();
    // create new playwright context

    const hostname = new URL(page.url()).hostname;

    let title = await page.title();

    if (title.length > 25) {
      title = title.substring(0, 25) + "...";
    }

    const context = await browser.newContext();

    const newPage = await context.newPage();

    const originalHeight = page.viewportSize()?.height || 720;
    const originalWidth = page.viewportSize()?.width || 1280;

    const browserFrameSvg = getBrowserFrameConfig(
      options.browserFrameType || "mac",
      options.darkMode || false
    );
    const frameOffset = browserFrameSvg.offset;

    await newPage.setViewportSize({
      width: originalWidth,
      height: originalHeight + frameOffset,
    });

    const webpageImage = await page.screenshot();

    const webpageImageData = webpageImage.toString("base64");

    newPage.setContent(browserFrameSvg.frame(hostname, title));

    await newPage.addStyleTag({
      content: `
        body {
         margin: 0;
         padding: 0;
        }
      `,
    });

    newPage.evaluate(
      ({ webpageImageData, originalHeight }) => {
        const img = document.createElement("img");

        img.src = `data:image/png;base64,${webpageImageData}`;

        img.style.width = "100%";
        img.style.height = originalHeight + "px";

        img.style.borderBottomLeftRadius = "10px";
        img.style.borderBottomRightRadius = "10px";

        document.body.appendChild(img);
      },
      { webpageImageData, originalHeight }
    );

    const screenshot = await newPage.screenshot({
      type: "png",
      omitBackground: true,
      ...options,
    });

    await browser.close();

    return screenshot;
  } else {
    return page.screenshot({
      type: "png",
      ...options,
    });
  }
};
