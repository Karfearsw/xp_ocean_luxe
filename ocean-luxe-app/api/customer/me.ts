import type { ApiRequest, ApiResponse } from "../_lib/http.js";
import { withErrorHandling } from "../_lib/handler.js";
import { getCustomerFromRequest } from "../_lib/customer-session.js";

async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const customer = await getCustomerFromRequest(req);
  if (!customer) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.status(200).json({ authenticated: true, customer });
}

export default withErrorHandling(handler);
