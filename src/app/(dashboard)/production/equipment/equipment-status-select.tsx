"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { updateEquipmentStatusAction } from "@/app/actions/equipment";

interface EquipmentStatusSelectProps {
    equipmentId: string;
    currentStatus: string;
}

const STATUS_OPTIONS = [
    { value: "active", label: "Active", className: "text-green-700" },
    { value: "maintenance", label: "Maintenance", className: "text-yellow-700" },
    { value: "decommissioned", label: "Decommissioned", className: "text-gray-500" },
];

export function EquipmentStatusSelect({ equipmentId, currentStatus }: EquipmentStatusSelectProps) {
    const router = useRouter();

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === currentStatus) return;

        const result = await updateEquipmentStatusAction(equipmentId, newStatus);

        if (result.success) {
            toast.success(result.message);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <SearchableSelect
            value={currentStatus}
            onValueChange={handleStatusChange}
            options={STATUS_OPTIONS.map(opt => ({
                value: opt.value,
                label: opt.label
            }))}
        />
    );
}
