import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-4">
            <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-red-100 p-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl">
                    Access Denied
                </h1>
                <p className="max-w-[600px] text-slate-500 md:text-xl/relaxed">
                    You do not have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                <div className="flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
