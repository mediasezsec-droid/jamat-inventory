import { requireAccess } from "@/lib/rbac";
import LostItemsClient from "./_components/lost-items-client";

export const dynamic = "force-dynamic";

export default async function LostItemsPage() {
    await requireAccess("/lost-items");
    return <LostItemsClient />;
}
