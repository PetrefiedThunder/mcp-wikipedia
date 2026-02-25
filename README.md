# mcp-wikipedia

Search Wikipedia articles, get summaries, full content, and 'On This Day' events.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `search` | Search Wikipedia articles. |
| `get_summary` | Get article summary/intro. |
| `get_article` | Get full article content as plain text. |
| `get_links` | Get links from an article. |
| `get_on_this_day` | Get notable events that happened on this day. |
| `random` | Get a random Wikipedia article. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-wikipedia.git
cd mcp-wikipedia
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wikipedia": {
      "command": "node",
      "args": ["/path/to/mcp-wikipedia/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-wikipedia
```

## License

MIT
