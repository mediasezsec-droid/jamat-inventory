
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, User as UserIcon, Shield, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User } from "@/types";

const userSchema = z.object({
    name: z.string().min(2, "Name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "MANAGER", "STAFF", "WATCHER"]),
    mobile: z.string().optional(),
});

import { useCurrentRole } from "@/hooks/use-current-role";

export default function UsersPage() {
    const role = useCurrentRole();
    const isAdmin = role === "ADMIN";
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: "",
            username: "",
            password: "",
            role: "STAFF",
            mobile: "",
        },
    });

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onSubmit = async (values: z.infer<typeof userSchema>) => {
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create user");
            }

            toast.success("User created successfully");
            setIsDialogOpen(false);
            form.reset();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            const res = await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setUserToDelete(null);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN": return <Badge className="bg-red-500">Admin</Badge>;
            case "MANAGER": return <Badge className="bg-amber-500">Manager</Badge>;
            case "STAFF": return <Badge className="bg-blue-500">Staff</Badge>;
            default: return <Badge variant="secondary">Watcher</Badge>;
        }
    };

    const handleEditUser = async (values: any) => {
        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, userId: userToEdit?.uid }),
            });

            if (!res.ok) throw new Error("Failed to update user");

            toast.success("User updated successfully");
            setUserToEdit(null);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update user");
        }
    };

    // ... existing code ...

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6">
            <PageHeader
                title="User Management"
                description="Create and manage system users and their roles."
                actions={
                    isAdmin && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-amber-600 hover:bg-amber-700 shadow-sm">
                                    <Plus className="mr-2 h-4 w-4" /> Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Username</FormLabel>
                                                    <FormControl><Input placeholder="johndoe" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl><Input type="password" placeholder="******" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                                            <SelectItem value="STAFF">Staff</SelectItem>
                                                            <SelectItem value="WATCHER">Watcher</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Create User</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )
                }
            />

            {isLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                        <Card key={user.uid} className="group hover:shadow-md transition-all duration-300 border-slate-200">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                                        {(user.name || user.username).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-slate-900">{user.name || user.username}</CardTitle>
                                        <CardDescription className="text-xs">@{user.username}</CardDescription>
                                    </div>
                                </div>
                                {getRoleBadge(user.role)}
                            </CardHeader>
                            <CardContent className="pt-4 border-t border-slate-100 mt-2">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-slate-500 flex items-center gap-1">
                                        <Shield className="h-3 w-3" /> {user.role}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                onClick={() => setUserToEdit(user)}
                                            >
                                                <UserIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setUserToDelete(user.uid)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit User Dialog */}
            <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    {userToEdit && (
                        <EditUserForm user={userToEdit} onSubmit={handleEditUser} />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function EditUserForm({ user, onSubmit }: { user: User, onSubmit: (values: any) => void }) {
    const [name, setName] = useState(user.name || "");
    const [email, setEmail] = useState(user.email || "");
    const [mobile, setMobile] = useState(user.mobile || "");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, email, mobile, password: password || undefined });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user.username} disabled className="bg-slate-100" />
            </div>
            <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={mobile} onChange={(e) => setMobile(e.target.value)} type="tel" />
            </div>
            <div className="space-y-2">
                <Label>New Password (Optional)</Label>
                <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Leave blank to keep current"
                />
            </div>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Update User</Button>
        </form>
    );
}
