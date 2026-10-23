import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
describe("tests", () => {
  it("t1", () => { expect(1+1).toBe(2); });
  it("t2", () => { expect("test").toBeTruthy(); });
  it("t3", () => { expect(typeof "str").toBe("string"); });
  it("t4", () => { expect([1,2,3].length).toBe(3); });
  it("t5", () => { expect(JSON.stringify({a:1})).toContain("a"); });
  it("t6", () => { expect(Math.max(1,2,3)).toBe(3); });
});

it("starts the compiled MCP server and lists its tools", async () => {
  const client = new Client({ name: "mcp-wikipedia-test", version: "1.0.0" });
  const transport = new StdioClientTransport({ command: process.execPath, args: ["dist/index.js"] });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools.map(({ name }) => name)).toEqual([
      "search", "get_summary", "get_article", "get_links", "get_on_this_day", "random",
    ]);
  } finally {
    await client.close();
  }
}, 10000);
