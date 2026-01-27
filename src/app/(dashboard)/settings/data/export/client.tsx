"use client";

import { FileSpreadsheet, FileJson, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function ExportDataClient() {
    const handleExport = (type: string, format: string) => {
        window.open(`/api/admin/export?type=${type}&format=${format}`, "_blank");
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <PageHeader
                title="Export Data"
                description="Download system data in Excel or JSON format."
                backUrl="/settings"
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <CardTitle>Export Options</CardTitle>
                    </div>
                    <CardDescription>Select a data type to export.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { id: "master", label: "Full System Backup", desc: "All users, events, inventory, and logs." },
                            { id: "users", label: "Users", desc: "Registered system users and roles." },
                            { id: "events", label: "Events", desc: "All booked and past events." },
                            { id: "inventory", label: "Inventory", desc: "Current stock items and levels." },
                            { id: "logs", label: "System Logs", desc: "Audit trail of all actions." },
                            { id: "ledger", label: "Ledger", desc: "Financial/Transaction records." },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div>
                                    <h4 className="font-medium text-slate-900">{item.label}</h4>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button id={`btn-data-export-${item.id}-excel`} variant="outline" size="sm" onClick={() => handleExport(item.id, "excel")} className="h-8">
                                        <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-green-600" /> Excel
                                    </Button>
                                    <Button id={`btn-data-export-${item.id}-json`} variant="outline" size="sm" onClick={() => handleExport(item.id, "json")} className="h-8">
                                        <FileJson className="mr-2 h-3.5 w-3.5 text-orange-600" /> JSON
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
