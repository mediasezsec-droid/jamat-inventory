import { Card } from "@/components/ui/card";

export function EventsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
                                <div className="h-3 w-20 bg-slate-100 animate-pulse rounded" />
                            </div>
                        </div>
                        <div className="h-5 w-16 bg-slate-100 animate-pulse rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-slate-100 animate-pulse rounded" />
                        <div className="h-3 w-2/3 bg-slate-100 animate-pulse rounded" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
