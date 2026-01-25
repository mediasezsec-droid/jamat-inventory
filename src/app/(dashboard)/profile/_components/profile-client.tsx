"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, Lock, User as UserIcon, Mail, Phone, Shield, KeyRound, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserData {
    id: string;
    name: string;
    email: string;
    mobile: string;
    username: string;
    role: string;
}

interface ProfileClientProps {
    initialUser: UserData;
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
    const { update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<"profile" | "security">("profile");

    // Profile State - initialized from SSR data
    const [name, setName] = useState(initialUser.name || "");
    const [email, setEmail] = useState(initialUser.email || "");
    const [mobile, setMobile] = useState(initialUser.mobile || "");
    const username = initialUser.username || "";
    const role = initialUser.role || "Member";

    // Password State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, mobile }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            await update({ name, email, mobile });
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
                description="Manage your account details and security settings."
            />

            {/* Profile Header Card */}
            <Card className="overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"></div>
                <CardContent className="relative pt-0 pb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-white">
                            {name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 pt-4 sm:pt-0 sm:pb-2">
                            <h2 className="text-2xl font-bold text-slate-900">{name || "User"}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
                                    @{username}
                                </Badge>
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {role}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                    onClick={() => setActiveSection("profile")}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all",
                        activeSection === "profile"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                    )}
                >
                    <UserIcon className="h-4 w-4 inline-block mr-2" />
                    Personal Details
                </button>
                <button
                    onClick={() => setActiveSection("security")}
                    className={cn(
                        "flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all",
                        activeSection === "security"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                    )}
                >
                    <Lock className="h-4 w-4 inline-block mr-2" />
                    Security
                </button>
            </div>

            {/* Profile Section */}
            {activeSection === "profile" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-indigo-600" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Update your personal details. Email is used for password recovery.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">Username</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                                    <Input value={username} disabled className="pl-8 bg-slate-50 text-slate-500" />
                                </div>
                                <p className="text-xs text-slate-400">Username cannot be changed</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">Full Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-11"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" /> Email Address
                                </Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="h-11"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" /> Mobile Number
                                </Label>
                                <Input
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    type="tel"
                                    className="h-11"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-11 px-6"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-amber-600" />
                            Change Password
                        </CardTitle>
                        <CardDescription>Secure your account with a new password. OTP verification required.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">New Password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={showOtpInput}
                                    placeholder="Enter new password"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 text-sm">Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={showOtpInput}
                                    placeholder="Confirm new password"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {showOtpInput && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in">
                                <Label className="text-amber-800 font-medium">Enter Verification Code</Label>
                                <Input
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    className="h-12 text-center text-xl font-mono tracking-widest"
                                />
                                <p className="text-xs text-amber-700">
                                    Check your email <strong>{email}</strong> for the verification code.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t gap-3">
                            {!showOtpInput ? (
                                <Button
                                    onClick={handleSendOtp}
                                    disabled={isLoading || !newPassword || !confirmPassword}
                                    className="bg-amber-600 hover:bg-amber-700 rounded-lg h-11 px-6"
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Send OTP
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowOtpInput(false)}
                                        disabled={isLoading}
                                        className="rounded-lg h-11"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isLoading || otp.length !== 6}
                                        className="bg-emerald-600 hover:bg-emerald-700 rounded-lg h-11 px-6"
                                    >
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Verify & Update
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
