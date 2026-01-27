import { Metadata } from "next";
import RestoreDataClient from "./client";

export const metadata: Metadata = {
    title: "Restore Data | Jamaat Inventory",
    description: "Restore system data.",
};

export default function RestoreDataPage() {
    return <RestoreDataClient />;
}
