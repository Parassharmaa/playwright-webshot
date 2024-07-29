import {
  type PageScreenshotOptions,
  type Locator,
  type Page,
} from "@playwright/test";

interface PaintConfig {
  locator: Locator;
  type: "box" | "arrow" | "mask" | "text";
  mask?: {
    color: string;
    blur: number;
  };
  box?: {
    border?: {
      width: number;
      color: string;
    };
    background?: string;
  };
  arrow?: {
    direction: "left" | "right" | "up" | "down";
    color: string;
    width?: number;
    height?: number;
    offset?: number;
    text?: string;
    textColor?: string;
    fontSize?: number;
    textBgColor?: string;
  };
  text?: {
    content: string;
    color: string;
    fontSize?: number;
    backgroundColor?: string;
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
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

export const webshot = async (
  page: Page,
  configs: PaintConfig[],
  options?: PageScreenshotOptions
) => {
  await Promise.all(
    configs.map(async (paintConfig) => {
      const { locator } = paintConfig;
      if (!locator) {
        throw new Error(
          `Could not find element with selector: ${paintConfig.locator}`
        );
      }
      const { box, arrow } = paintConfig;

      if (box) {
        await locator.evaluate((element, box) => {
          if (box.border) {
            element.style.border = `${box.border.width}px solid ${box.border.color}`;
          }

          if (box.background) {
            element.style.background = box.background;
          }
        }, box);
      }

      if (arrow) {
        // add arrow css
        const { className, css } = addArrowCss(arrow.color);

        // inject css to the page
        await page.addStyleTag({
          content: css,
        });
        await locator.evaluate(
          (element, { arrow, className }) => {
            const arrowElement = document.createElement("div");

            arrowElement.classList.add(className);

            arrowElement.style.backgroundColor = arrow.color;
            arrowElement.style.width = `${arrow.width || 100}px`;
            arrowElement.style.height = `${arrow.height || 10}px`;

            // add zIndex to make sure it's on top
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
              const arrowRect = arrowElement.getBoundingClientRect();

              textElement.style.position = "fixed";

              document.body.appendChild(textElement);

              textElement.innerHTML = arrow.text;

              textElement.style.color = arrow.textColor || "black";

              textElement.style.zIndex = "99999";

              textElement.style.fontSize = `${arrow.fontSize}px`;

              textElement.style.background = arrow.textBgColor || "transparent";

              textElement.style.padding = "2px";

              textElement.style.lineHeight = "1";

              const textRect = textElement.getBoundingClientRect();

              switch (arrow.direction) {
                case "left":
                  textElement.style.left = `${
                    arrowRect.left - textRect.width
                  }px`;
                  textElement.style.top = `${
                    arrowRect.top - textRect.height / 2
                  }px`;
                  break;
                case "right":
                  textElement.style.left = `${arrowRect.right}px`;
                  textElement.style.top = `${
                    arrowRect.top - textRect.height / 2
                  }px`;
                  break;
                case "up":
                  textElement.style.left = `${
                    arrowRect.left - textRect.width / 2
                  }px`;
                  textElement.style.top = `${
                    arrowRect.top - textRect.height
                  }px`;
                  break;

                case "down":
                  textElement.style.left = `${
                    arrowRect.left - textRect.width / 2
                  }px`;
                  textElement.style.top = `${arrowRect.bottom}px`;
                  break;
              }
            }
          },
          { arrow, className }
        );
      }

      if (paintConfig.type === "mask") {
        if (!paintConfig.mask) {
          throw new Error("Mask config is required");
        }
        await locator.evaluate((element, mask) => {
          const maskElement = document.createElement("div");
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
        }, paintConfig.mask);
      }

      if (paintConfig.type === "text") {
        if (!paintConfig.text) {
          throw new Error("Text config is required");
        }
        await locator.evaluate((element, text) => {
          const textElement = document.createElement("div");
          textElement.style.position = "fixed";
          textElement.style.top = text.top || "none";
          textElement.style.left = text.left || "none";
          textElement.style.right = text.right || "none";
          textElement.style.bottom = text.bottom || "none";

          textElement.style.zIndex = "9999";
          textElement.style.color = text.color || "black";
          textElement.style.fontSize = `${text.fontSize}px`;
          textElement.style.background = text.backgroundColor || "transparent";
          textElement.style.padding = "2px";
          textElement.style.lineHeight = "1";

          textElement.style.textAlign = "center";

          textElement.innerHTML = text.content;

          // append text element to the body
          document.body.appendChild(textElement);
        }, paintConfig.text);
      }
    })
  );

  return page.screenshot({ type: "png", ...options });
};
