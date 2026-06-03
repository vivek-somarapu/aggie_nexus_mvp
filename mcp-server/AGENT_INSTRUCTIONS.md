# AggieX MCP — Agent Instructions

**Version:** 0.1.1
**Updated:** 2026-06-02

This file is fetched live by the `update_aggiex_mcp` tool. Call it whenever you are unsure about your configuration, encounter connection errors, or want to check if a server update is available.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `update_aggiex_mcp` | Fetch this file — latest instructions and version |
| `get_team_status` | Team name, current program week, submission progress |
| `get_pending_deliverables` | Deliverables not yet submitted or needing revision |
| `submit_deliverable(deliverable_id, text_content)` | Submit a written response for a deliverable |
| `log_traction(metric_type, value, unit, notes?)` | Log a metric: users, revenue, LOIs, pilots, retention, churn |
| `get_traction_history` | View recent traction log entries |

---

## Setup

### macOS / Linux

**1. Install (run once in Terminal):**
```bash
mkdir -p ~/.aggiex && curl -fsSL https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js -o ~/.aggiex/server.js && chmod +x ~/.aggiex/server.js
```

**2. Add to `.claude/settings.json`:**
```json
{
  "mcpServers": {
    "aggiex": {
      "command": "/bin/bash",
      "args": ["-lc", "node ~/.aggiex/server.js"],
      "env": {
        "AGGIEX_API_KEY": "YOUR_KEY",
        "AGGIEX_BASE_URL": "https://www.accelerator.aggiex.org"
      }
    }
  }
}
```

> **Why `/bin/bash -lc`?** Claude Code spawns the MCP process directly — it does not go through a shell, so `~` and your PATH (including Homebrew Node) would not be available. The `-l` flag loads your login profile so Node is on PATH; `-c` runs the command through bash so `~` expands correctly.

---

### Windows

**1. Install (run once in PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.aggiex"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js" -OutFile "$env:USERPROFILE\.aggiex\server.js"
```

**2. Add to `.claude/settings.json`:**
```json
{
  "mcpServers": {
    "aggiex": {
      "command": "cmd.exe",
      "args": ["/c", "node %USERPROFILE%\\.aggiex\\server.js"],
      "env": {
        "AGGIEX_API_KEY": "YOUR_KEY",
        "AGGIEX_BASE_URL": "https://www.accelerator.aggiex.org"
      }
    }
  }
}
```

---

## Proactive Usage

- **Session start:** call `get_team_status` and `get_pending_deliverables` to understand what is outstanding
- **User mentions metrics** ("we hit 200 users", "closed an LOI", "$5k MRR"): offer to `log_traction`
- **Work completes on something matching a deliverable:** offer to `submit_deliverable`
- **Connection errors or config issues:** call `update_aggiex_mcp` for the latest troubleshooting guidance
- Always confirm with the user before submitting or logging anything

---

## Updating the Server

Re-run the install command for your platform above to pull the latest binary. After re-running, restart Claude Code (or reload MCP servers) to pick up the new version.

---

## Troubleshooting

**"AGGIEX_API_KEY environment variable is required"**
→ The `env` block in your settings.json is missing or the key is empty. Generate a new key at `https://www.accelerator.aggiex.org/accelerator/my-team/developer`.

**"spawn /bin/bash ENOENT" or node not found**
→ Try replacing `/bin/bash` with `/bin/zsh` (macOS default since Catalina). Or find your node path with `which node` in Terminal and use it directly: `"args": ["-lc", "/usr/local/bin/node ~/.aggiex/server.js"]`.

**"HTTP 401" or "HTTP 403"**
→ Your API key has been revoked or is invalid. Generate a new one at the Developer API page and update your settings.json.

**Server connects but tools return errors**
→ Verify `AGGIEX_BASE_URL` is set to `https://www.accelerator.aggiex.org` (no trailing slash).
