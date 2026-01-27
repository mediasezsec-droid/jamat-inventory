import { Metadata } from "next";
import ResetSystemClient from "./client";

export const metadata: Metadata = {
    title: "System Reset | Jamaat Inventory",
    description: "Danger - System Reset",
};

export default function ResetSystemPage() {
    return <ResetSystemClient />;
}
