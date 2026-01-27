import { Metadata } from "next";
import ExportDataClient from "./client";

export const metadata: Metadata = {
    title: "Export Data | Jamaat Inventory",
    description: "Export system data.",
};

export default function ExportDataPage() {
    return <ExportDataClient />;
}
