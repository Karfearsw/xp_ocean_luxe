import type { ApiRequest, ApiResponse } from "./http.js";

type Handler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

function buildHint(message: string) {
  if (message.includes("Database schema missing required tables")) {
    return "Migrations may not have been applied to this database.";
  }
  if (message.includes("Missing DATABASE_URL") || message.includes("POSTGRES_URL") || message.includes("NEON_DATABASE_URL")) {
    return "Verify DB environment variables are set for this deployment.";
  }
  if (message.includes("Invalid DATABASE_URL")) {
    return "Verify the database connection string starts with postgres:// or postgresql://";
  }
  return undefined;
}

export function withErrorHandling(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";
      const hint = buildHint(message);
      const status = message.toLowerCase().includes("not found") ? 404 : 500;
      res.status(status).json(hint ? { message, hint } : { message });
    }
  };
}
