import { Metadata } from "next";
import SyncDataClient from "./client";

export const metadata: Metadata = {
    title: "Database Sync | Jamaat Inventory",
    description: "Sync databases.",
};

export default function SyncDataPage() {
    return <SyncDataClient />;
}
