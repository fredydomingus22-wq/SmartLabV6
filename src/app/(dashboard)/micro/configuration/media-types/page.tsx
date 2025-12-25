import { createClient } from "@/lib/supabase/server";
import { MediaTypeDialog } from "./media-type-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteMediaTypeAction } from "@/app/actions/micro-media";
import { DeleteButton } from "@/components/smart/delete-button";

export const dynamic = "force-dynamic";

export default async function MediaTypesPage() {
    const supabase = await createClient();

    // 1. Fetch current user plant
    const { data: userData } = await supabase.from("user_profiles").select("plant_id").single();
    const plantId = userData?.plant_id;

    if (!plantId) {
        return <div className="p-8">Please select a plant first.</div>;
    }

    // 2. Fetch Media Types
    const { data: mediaTypes } = await supabase
        .from("micro_media_types")
        .select("*")
        .order("name");

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Media Types</h1>
                    <p className="text-muted-foreground">Manage microbiological culture media configurations.</p>
                </div>
                <MediaTypeDialog plantId={plantId} />
            </div>

            <div className="rounded-md border bg-background/50 glass">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Incubation Range</TableHead>
                            <TableHead>Temperature</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mediaTypes?.map((mt) => (
                            <TableRow key={mt.id}>
                                <TableCell className="font-medium">{mt.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{mt.incubation_hours_min} - {mt.incubation_hours_max}h</Badge>
                                    </div>
                                </TableCell>
                                <TableCell>{mt.incubation_temp_c}°C</TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                                    {mt.description || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <MediaTypeDialog plantId={plantId} mediaType={mt} />
                                        <DeleteButton
                                            action={deleteMediaTypeAction}
                                            id={mt.id}
                                            confirmMessage={`Permanently delete ${mt.name}?`}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {mediaTypes?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No media types found. Create one.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
