// Public health check used by the MCP server's `health` tool and by
// `openclaw mcp probe`. No auth, no DB hit — just confirms the app is up.

export async function GET() {
  return Response.json({ ok: true, version: '1' })
}
