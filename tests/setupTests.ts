/* eslint-disable import/no-extraneous-dependencies */
import { TextEncoder, TextDecoder } from "node:util";
import { expect } from "vitest";
import { configureToMatchImageSnapshot } from "jest-image-snapshot";

// need to polyfill these for the JSDom env, even on node v19 - https://github.com/jsdom/jsdom/issues/2524
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as never;

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  failureThresholdType: "percent",
  failureThreshold: 0.1,
  customSnapshotIdentifier: (options) => {
    // use the same file names as jest
    const testName = options.currentTestName
      .replace("tests/", "")
      .replaceAll(/([\s.>])+/g, "-")
      .replace("PDFs", "pd-fs")
      .replaceAll(/([a-z])([A-Z])/g, "$1-$2") // convert to kebab-case
      .toLowerCase();
    return `${testName}-${options.counter}-snap`;
  },
});

expect.extend({ toMatchImageSnapshot });
