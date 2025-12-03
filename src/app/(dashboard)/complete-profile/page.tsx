
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Save, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function CompleteProfilePage() {
    const router = useRouter();
    const { update } = useSession();
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (skip = false) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, mobile, skip }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            await update({
                profileStatus: skip ? "SKIPPED" : "COMPLETED",
                email: skip ? undefined : email,
                mobile: skip ? undefined : mobile
            }); // Update session with new status
            toast.success(skip ? "Profile skipped" : "Profile updated successfully");
            router.push("/events"); // Redirect to dashboard
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
                    <CardDescription className="text-center">
                        Please provide your contact details to stay updated.
                        <br />
                        This is a one-time process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input
                            id="mobile"
                            type="tel"
                            placeholder="1234567890"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        onClick={() => handleSubmit(false)}
                        disabled={isLoading || !email || !mobile}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save & Continue
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-slate-500"
                        onClick={() => handleSubmit(true)}
                        disabled={isLoading}
                    >
                        <SkipForward className="mr-2 h-4 w-4" />
                        Skip for now (Don't ask again)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
