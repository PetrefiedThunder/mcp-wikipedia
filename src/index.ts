#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://en.wikipedia.org/api/rest_v1";
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const UA = "mcp-wikipedia/1.0.0";
const RATE_LIMIT_MS = 200;
let last = 0;

async function wFetch(url: string): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-wikipedia", version: "1.0.0" });

server.tool("search", "Search Wikipedia articles.", {
  query: z.string(), limit: z.number().min(1).max(50).default(10),
}, async ({ query, limit }) => {
  const p = new URLSearchParams({ action: "query", list: "search", srsearch: query, srlimit: String(limit), format: "json" });
  const d = await wFetch(`${WIKI_API}?${p}`);
  const results = d.query?.search?.map((r: any) => ({
    title: r.title, snippet: r.snippet?.replace(/<[^>]+>/g, ""), wordcount: r.wordcount, pageid: r.pageid,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ totalHits: d.query?.searchinfo?.totalhits, results }, null, 2) }] };
});

server.tool("get_summary", "Get article summary/intro.", {
  title: z.string().describe("Article title (e.g. 'Machine learning')"),
}, async ({ title }) => {
  const d = await wFetch(`${BASE}/page/summary/${encodeURIComponent(title)}`);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    title: d.title, description: d.description, extract: d.extract,
    thumbnail: d.thumbnail?.source, url: d.content_urls?.desktop?.page,
  }, null, 2) }] };
});

server.tool("get_article", "Get full article content as plain text.", {
  title: z.string(),
}, async ({ title }) => {
  const p = new URLSearchParams({ action: "query", titles: title, prop: "extracts", explaintext: "1", format: "json" });
  const d = await wFetch(`${WIKI_API}?${p}`);
  const pages = d.query?.pages;
  const page = pages ? Object.values(pages)[0] as any : null;
  return { content: [{ type: "text" as const, text: JSON.stringify({
    title: page?.title, extract: page?.extract?.slice(0, 10000),
    fullLength: page?.extract?.length,
  }, null, 2) }] };
});

server.tool("get_links", "Get links from an article.", {
  title: z.string(), limit: z.number().min(1).max(500).default(50),
}, async ({ title, limit }) => {
  const p = new URLSearchParams({ action: "query", titles: title, prop: "links", pllimit: String(limit), format: "json" });
  const d = await wFetch(`${WIKI_API}?${p}`);
  const pages = d.query?.pages;
  const page = pages ? Object.values(pages)[0] as any : null;
  const links = page?.links?.map((l: any) => l.title);
  return { content: [{ type: "text" as const, text: JSON.stringify(links, null, 2) }] };
});

server.tool("get_on_this_day", "Get notable events that happened on this day.", {
  month: z.number().min(1).max(12), day: z.number().min(1).max(31),
}, async ({ month, day }) => {
  const d = await wFetch(`${BASE}/feed/onthisday/events/${month}/${day}`);
  const events = d.events?.slice(0, 10).map((e: any) => ({
    year: e.year, text: e.text,
    pages: e.pages?.slice(0, 2).map((p: any) => p.title),
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(events, null, 2) }] };
});

server.tool("random", "Get a random Wikipedia article.", {}, async () => {
  const d = await wFetch(`${BASE}/page/random/summary`);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    title: d.title, description: d.description, extract: d.extract, url: d.content_urls?.desktop?.page,
  }, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
