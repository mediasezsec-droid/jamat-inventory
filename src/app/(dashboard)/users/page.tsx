import { requireAccess } from "@/lib/rbac";
import { UsersClient } from "./_components/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    await requireAccess("/users");
    return <UsersClient />;
}
