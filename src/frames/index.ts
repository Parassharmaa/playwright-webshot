import frameChromeDark from "./frameChromeDark";
import frameChromeLight from "./frameChromeLight";
import frameMacDark from "./frameMacDark";
import frameMacLight from "./frameMacLight";

export const framesConfig = {
  mac: {
    dark: {
      frame: frameMacDark,
      offset: 53,
    },
    light: {
      frame: frameMacLight,
      offset: 53,
    },
  },
  chrome: {
    dark: {
      frame: frameChromeDark,
      offset: 105,
    },
    light: {
      frame: frameChromeLight,
      offset: 105,
    },
  },
};

export const getBrowserFrameConfig = (
  type: "mac" | "chrome",
  darkMode: boolean
) => {
  return framesConfig[type][darkMode ? "dark" : "light"];
};
