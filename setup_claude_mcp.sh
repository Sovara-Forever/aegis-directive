#!/bin/bash
# =============================================================================
# setup_claude_mcp.sh - Automate Claude Code MCP Server Configuration
# =============================================================================
# Configures ~/.claude/settings.json to wire Claude Code to mcp_aegis_server.py
#
# Author: Sean Jeremy Chappell & Alpha Claudette Chappell
# Session: 14 - DIRECTIVE 4
# =============================================================================

set -e  # Exit on error

CLAUDE_CONFIG_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_CONFIG_DIR/settings.json"
VENV_PYTHON="/home/arean/.venv/bin/python"
MCP_SERVER_SCRIPT="/home/arean/ara_project/mcp_aegis_server.py"

echo "======================================================================="
echo "  AEGIS MCP SERVER SETUP FOR CLAUDE CODE"
echo "======================================================================="
echo "  Config file: $CLAUDE_SETTINGS"
echo "  Python:      $VENV_PYTHON"
echo "  MCP Server:  $MCP_SERVER_SCRIPT"
echo "======================================================================="
echo ""

# Create .claude directory if it doesn't exist
if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "📁 Creating $CLAUDE_CONFIG_DIR..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

# Check if mcp_aegis_server.py exists
if [ ! -f "$MCP_SERVER_SCRIPT" ]; then
    echo "❌ ERROR: MCP server script not found at $MCP_SERVER_SCRIPT"
    exit 1
fi

# Check if venv Python exists
if [ ! -f "$VENV_PYTHON" ]; then
    echo "❌ ERROR: venv Python not found at $VENV_PYTHON"
    echo "   Run: cd /home/arean && python3 -m venv .venv"
    exit 1
fi

# Generate settings.json content
SETTINGS_JSON=$(cat <<EOF
{
  "mcpServers": {
    "aegis-intelligence": {
      "command": "$VENV_PYTHON",
      "args": [
        "$MCP_SERVER_SCRIPT"
      ],
      "env": {
        "PYTHONUNBUFFERED": "1"
      },
      "description": "Aegis Intelligence MCP Server - Supabase queries, dealer data, content generation"
    }
  }
}
EOF
)

# Backup existing settings if present
if [ -f "$CLAUDE_SETTINGS" ]; then
    BACKUP_FILE="${CLAUDE_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Backing up existing settings to $BACKUP_FILE"
    cp "$CLAUDE_SETTINGS" "$BACKUP_FILE"
fi

# Write new settings
echo "✍️  Writing MCP configuration..."
echo "$SETTINGS_JSON" > "$CLAUDE_SETTINGS"

echo ""
echo "======================================================================="
echo "  ✅ CLAUDE CODE MCP CONFIGURATION COMPLETE"
echo "======================================================================="
echo "  Configuration saved to: $CLAUDE_SETTINGS"
echo ""
echo "  Next steps:"
echo "  1. Restart Claude Code in VS Code terminal"
echo "  2. Test MCP connection: Use Claude Code to query Supabase"
echo "  3. Check logs if issues: tail -f ~/.claude/logs/mcp-aegis-intelligence.log"
echo "======================================================================="
echo ""

# Make MCP server executable
if [ ! -x "$MCP_SERVER_SCRIPT" ]; then
    echo "🔧 Making MCP server executable..."
    chmod +x "$MCP_SERVER_SCRIPT"
fi

echo "✅ Setup complete. Claude Code is now wired to Aegis Intelligence MCP Server."
