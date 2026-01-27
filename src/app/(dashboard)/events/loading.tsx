import { EventsSkeleton } from "@/components/skeletons/events-skeleton";

export default function EventsLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="h-8 w-48 bg-slate-100 animate-pulse rounded mb-2" />
                    <div className="h-4 w-64 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="flex gap-2">
                    <div className="h-11 w-32 bg-slate-100 animate-pulse rounded-xl" />
                    <div className="h-11 w-32 bg-slate-100 animate-pulse rounded-xl" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 w-full bg-slate-100 rounded-xl animate-pulse" />
                ))}
            </div>

            <EventsSkeleton />
        </div>
    );
}
