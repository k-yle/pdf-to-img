/**
 * @jest-environment node
 */
import { pdf } from "../src";

describe("example.pdf in node", () => {
  it("correctly generates a single png for the one page in nodejs environment", async () => {
    for await (const page of await pdf("./tests/example.pdf")) {
      expect(page).toMatchImageSnapshot();
    }
  });
});
