import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { redirect } from "next/navigation";
import ProfileClient from "./_components/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;

    // Fetch full user data from Firestore
    let userData = {
        id: userId,
        name: session.user.name || "",
        email: session.user.email || "",
        mobile: (session.user as any).mobile || "",
        username: (session.user as any).username || "",
        role: (session.user as any).role || "Member",
    };

    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            userData = {
                id: userId,
                name: data?.name || session.user.name || "",
                email: data?.email || session.user.email || "",
                mobile: data?.mobile || "",
                username: data?.username || "",
                role: data?.role || "Member",
            };
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
    }

    return <ProfileClient initialUser={userData} />;
}
