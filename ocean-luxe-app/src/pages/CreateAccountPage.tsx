import { useSearchParams } from "react-router-dom";
import AccountLoginPage from "./AccountLoginPage";

export default function CreateAccountPage() {
  const [params] = useSearchParams();
  const bookingId = params.get("booking");

  return <AccountLoginPage key={bookingId ?? "account"} />;
}
