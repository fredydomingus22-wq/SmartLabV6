"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2 } from "lucide-react";
import { ResultDialog } from "./result-dialog";

interface Sample {
    id: string;
    code: string;
    status: string;
    batch?: {
        code: string;
        product?: { id?: string; name: string }[] | { id?: string; name: string }
    }[] | {
        code: string;
        product?: { id?: string; name: string }[] | { id?: string; name: string }
    };
    intermediate?: {
        production_batches: {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        }[] | {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        };
    }[] | {
        production_batches: {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        }[] | {
            code: string;
            product?: { id?: string; name: string }[] | { id?: string; name: string }
        };
    };
}

interface ResultDialogWrapperProps {
    sample: Sample;
}

// This wrapper fetches specs on demand when the Analyze button is clicked
export function ResultDialogWrapper({ sample }: ResultDialogWrapperProps) {
    const [specs, setSpecs] = useState<any[]>([]);
    const [existingResults, setExistingResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    const getProductId = useCallback(() => {
        // Path 1: Direct batch link
        const batch = Array.isArray(sample.batch) ? sample.batch[0] : sample.batch;
        if (batch) {
            const product = batch?.product;
            const prod = Array.isArray(product) ? product[0] : product;
            if (prod?.id) return prod.id;
        }

        // Path 2: Intermediate product link
        const intermediate = Array.isArray(sample.intermediate) ? sample.intermediate[0] : sample.intermediate;
        if (intermediate) {
            const ipBatch = Array.isArray(intermediate.production_batches)
                ? intermediate.production_batches[0]
                : intermediate.production_batches;
            const product = ipBatch?.product;
            const prod = Array.isArray(product) ? product[0] : product;
            if (prod?.id) return prod.id;
        }

        return undefined;
    }, [sample.batch, sample.intermediate]);

    const fetchSpecs = async () => {
        const productId = getProductId();
        if (!productId) {
            console.log("No product ID found for sample");
            setShowDialog(true);
            return;
        }

        setLoading(true);
        try {
            // Fetch specifications for the product
            const specRes = await fetch(`/api/lab/specifications?productId=${productId}`);
            if (specRes.ok) {
                const specData = await specRes.json();
                setSpecs(specData.specifications || []);
            }

            // Fetch existing results for this sample
            const resultsRes = await fetch(`/api/lab/results?sampleId=${sample.id}`);
            if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                setExistingResults(resultsData.results || []);
            }
        } catch (error) {
            console.error("Failed to fetch specs:", error);
        } finally {
            setLoading(false);
            setShowDialog(true);
        }
    };

    if (!showDialog) {
        return (
            <Button size="sm" variant="outline" onClick={fetchSpecs} disabled={loading}>
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <FlaskConical className="mr-2 h-4 w-4" />
                )}
                Analyze
            </Button>
        );
    }

    return (
        <ResultDialog
            sample={sample}
            specifications={specs}
            existingResults={existingResults}
        />
    );
}
