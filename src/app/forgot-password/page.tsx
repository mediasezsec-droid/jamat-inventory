
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"USERNAME" | "OTP" | "SUCCESS">("USERNAME");
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [username, setUsername] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Error State
    const [noEmailError, setNoEmailError] = useState(false);

    const handleInit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNoEmailError(false);
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            const data = await res.json();

            if (res.status === 404) {
                toast.error("User not found");
                return;
            }

            if (data.error === "NO_EMAIL") {
                setNoEmailError(true);
                return;
            }

            if (!res.ok) throw new Error(data.error || "Something went wrong");

            setMaskedEmail(data.email);
            setStep("OTP");
            toast.success("OTP sent to your email");
        } catch (error: any) {
            toast.error(error.message || "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, otp, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to reset password");

            setStep("SUCCESS");
            toast.success("Password reset successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-amber-600">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => router.push("/login")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    </div>
                    <CardDescription>
                        {step === "USERNAME" && "Enter your username to verify your identity."}
                        {step === "OTP" && `Enter the code sent to ${maskedEmail}`}
                        {step === "SUCCESS" && "Your password has been updated."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === "USERNAME" && (
                        <form onSubmit={handleInit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            {noEmailError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                                    <p className="font-semibold mb-1">Cannot Reset Password</p>
                                    <p>No email address is linked to this account.</p>
                                    <p className="mt-2 font-medium">Please contact "Aziz Bhai Fakkad" for assistance.</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading || !username}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                            </Button>
                        </form>
                    )}

                    {step === "OTP" && (
                        <form onSubmit={handleComplete} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                                <Input
                                    id="otp"
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    className="text-center text-lg tracking-widest"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="******"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="******"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading || otp.length !== 6}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
                            </Button>
                        </form>
                    )}

                    {step === "SUCCESS" && (
                        <div className="text-center space-y-6 py-6">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">All Done!</h3>
                                <p className="text-slate-500">Your password has been successfully reset.</p>
                            </div>
                            <Button className="w-full" onClick={() => router.push("/login")}>
                                Return to Login
                            </Button>
                        </div>
                    )}
                </CardContent>
                {step === "USERNAME" && (
                    <CardFooter className="flex justify-center border-t p-4">
                        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900">
                            Back to Login
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
