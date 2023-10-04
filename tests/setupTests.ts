/* eslint-disable import/no-extraneous-dependencies */
import { TextEncoder, TextDecoder } from "node:util";
import { configureToMatchImageSnapshot } from "jest-image-snapshot";

// need to polyfill these for the JSDom env, even on node v19 - https://github.com/jsdom/jsdom/issues/2524
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as never;

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  failureThresholdType: "percent",
  failureThreshold: 0.1,
});

expect.extend({ toMatchImageSnapshot });
