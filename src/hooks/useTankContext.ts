"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface TankContext {
    tankId: string | null;
    tankCode: string | null;
    batchId: string | null;
    batchCode: string | null;
    productId: string | null;
    productName: string | null;
    productSku: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * useTankContext: Shared hook for resolving Tank -> Batch -> Product context.
 * Used by Lab, Micro, and Production sample creation dialogs to eliminate
 * duplicated context resolution logic.
 */
export function useTankContext(intermediateProductId: string | null): TankContext {
    const [context, setContext] = useState<TankContext>({
        tankId: intermediateProductId,
        tankCode: null,
        batchId: null,
        batchCode: null,
        productId: null,
        productName: null,
        productSku: null,
        isLoading: false,
        error: null,
    });

    const resolveContext = useCallback(async () => {
        if (!intermediateProductId) {
            setContext(prev => ({ ...prev, isLoading: false }));
            return;
        }

        setContext(prev => ({ ...prev, isLoading: true, error: null }));
        const supabase = createClient();

        try {
            // Fetch Intermediate Product with Batch and Product
            const { data: ip, error: ipError } = await supabase
                .from("intermediate_products")
                .select(`
                    id,
                    code,
                    production_batch_id,
                    production_batches(
                        id,
                        code,
                        product_id,
                        products(id, name, sku)
                    )
                `)
                .eq("id", intermediateProductId)
                .single();

            if (ipError || !ip) {
                setContext(prev => ({
                    ...prev,
                    isLoading: false,
                    error: "Failed to resolve tank context."
                }));
                return;
            }

            const batch = Array.isArray(ip.production_batches)
                ? ip.production_batches[0]
                : ip.production_batches;

            // Handle array vs object for product relation
            const rawProduct = batch?.products;
            const productData = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;

            setContext({
                tankId: ip.id,
                tankCode: ip.code,
                batchId: batch?.id || null,
                batchCode: batch?.code || null,
                productId: productData?.id || null,
                productName: productData?.name || null,
                productSku: productData?.sku || null,
                isLoading: false,
                error: null,
            });
        } catch (e: any) {
            setContext(prev => ({
                ...prev,
                isLoading: false,
                error: e.message || "Unknown error resolving context."
            }));
        }
    }, [intermediateProductId]);

    useEffect(() => {
        resolveContext();
    }, [resolveContext]);

    return context;
}
