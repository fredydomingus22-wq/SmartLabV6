import { getTrainingMatrixData } from "@/app/actions/quality/training-matrix";
import TrainingMatrixClient from "./matrix-client";

export const metadata = {
    title: "Training Matrix | SmartLab",
    description: "Overview of company-wide training status."
};

export default async function MatrixPage() {
    const { data } = await getTrainingMatrixData();

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <TrainingMatrixClient data={data} />
        </div>
    );
}
