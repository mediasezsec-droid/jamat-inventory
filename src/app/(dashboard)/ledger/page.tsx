import { requireAccess } from "@/lib/rbac";
import { LedgerClient } from "./_components/ledger-client";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
    await requireAccess("/ledger");
    return <LedgerClient />;
}
