import { Metadata } from "next";
import HealthCheckClient from "./client";

export const metadata: Metadata = {
    title: "System Health | Jamaat Inventory",
    description: "Check system health.",
};

export default function HealthCheckPage() {
    return <HealthCheckClient />;
}
