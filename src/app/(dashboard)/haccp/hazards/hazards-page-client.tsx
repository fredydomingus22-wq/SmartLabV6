"use client";

import { DataGrid } from "@/components/smart/data-grid";
import { Badge } from "@/components/ui/badge";

interface Hazard {
    id: string;
    process_step: string;
    hazard_description: string;
    hazard_category: string;
    risk_probability: number;
    risk_severity: number;
    is_pcc: boolean;
    control_measure?: string;
}

interface HazardsPageClientProps {
    hazards: Hazard[];
}

export function HazardsPageClient({ hazards }: HazardsPageClientProps) {
    const columns = [
        { key: "process_step", label: "Process Step" },
        { key: "hazard_description", label: "Hazard" },
        {
            key: "hazard_category",
            label: "Category",
            render: (row: Hazard) => <Badge variant="outline">{row.hazard_category}</Badge>
        },
        {
            key: "risk",
            label: "Risk (P×S)",
            render: (row: Hazard) => {
                const score = row.risk_probability * row.risk_severity;
                let variant: "default" | "secondary" | "destructive" = "secondary";
                if (score >= 15) variant = "destructive";
                else if (score >= 9) variant = "default";
                return <Badge variant={variant}>{score}</Badge>
            }
        },
        {
            key: "is_pcc",
            label: "PCC?",
            render: (row: Hazard) => row.is_pcc ? <Badge className="bg-red-600">CCP</Badge> : <span className="text-muted-foreground">-</span>
        },
        { key: "control_measure", label: "Control Measure" },
    ];

    return <DataGrid data={hazards} columns={columns} />;
}
