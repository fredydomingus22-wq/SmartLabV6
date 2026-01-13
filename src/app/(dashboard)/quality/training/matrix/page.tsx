import { getTrainingMatrixData } from "@/app/actions/quality/training-matrix";
import TrainingMatrixClient from "./matrix-client";
import { PageHeader } from "@/components/layout/page-header";
import { TableProperties } from "lucide-react";

export const metadata = {
    title: "Training Matrix | SmartLab",
    description: "Overview of company-wide training status."
};

export default async function MatrixPage() {
    const { data } = await getTrainingMatrixData();

    return (
        <div className="space-y-8">
            <PageHeader
                variant="blue"
                icon={<TableProperties className="h-4 w-4" />}
                overline="Audit Ready Matrix"
                title="Matriz de Qualificação"
                description="Overview of company-wide training status and compliance."
                backHref="/quality"
            />
            <TrainingMatrixClient data={data} />
        </div>
    );
}
