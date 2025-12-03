
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [username, setUsername] = useState("");

    // Password State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);

    useEffect(() => {
        if (session?.user) {
            const user = session.user as any;
            setName(user.name || "");
            setEmail(user.email || "");
            setMobile(user.mobile || "");
            setUsername(user.username || ""); // Username is read-only
        }
    }, [session]);

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, mobile }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            await update({ name, email, mobile }); // Optimistic update
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/otp/send", { method: "POST" });
            if (!res.ok) throw new Error("Failed to send OTP");

            toast.success("OTP sent to your email");
            setShowOtpInput(true);
        } catch (error) {
            toast.error("Failed to send OTP. Ensure your email is correct.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/update-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update password");

            toast.success("Password updated successfully");
            setNewPassword("");
            setConfirmPassword("");
            setOtp("");
            setShowOtpInput(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="My Profile"
                description="Manage your account details and security."
            />

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="details">Personal Details</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-amber-600" />
                                <CardTitle>Personal Information</CardTitle>
                            </div>
                            <CardDescription>Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={username} disabled className="bg-slate-100" />
                                    <p className="text-xs text-slate-500">Username cannot be changed.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile Number</Label>
                                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} type="tel" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleUpdateProfile} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-slate-600" />
                                <CardTitle>Change Password</CardTitle>
                            </div>
                            <CardDescription>Update your password. (OTP Verification will be required)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={showOtpInput}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={showOtpInput}
                                />
                            </div>

                            {showOtpInput && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Enter OTP</Label>
                                    <Input
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit code sent to your email"
                                        maxLength={6}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Check your email for the verification code.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 gap-2">
                                {!showOtpInput ? (
                                    <Button
                                        onClick={handleSendOtp}
                                        disabled={isLoading || !newPassword || !confirmPassword}
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="ghost" onClick={() => setShowOtpInput(false)} disabled={isLoading}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleChangePassword} disabled={isLoading || otp.length !== 6} className="bg-green-600 hover:bg-green-700">
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Update"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
