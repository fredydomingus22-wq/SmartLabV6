import { NextResponse } from "next/server";
import { getProductSpecifications } from "@/lib/queries/lab";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ specifications: [] });
    }

    try {
        const specifications = await getProductSpecifications(productId);
        return NextResponse.json({ specifications });
    } catch (error) {
        console.error("Error fetching specifications:", error);
        return NextResponse.json({ specifications: [], error: "Failed to fetch" }, { status: 500 });
    }
}
