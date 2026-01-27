import { analyzeOccupation } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { occupation } = await req.json();

        if (!occupation) {
            return NextResponse.json({ error: "Occupation is required" }, { status: 400 });
        }

        const analysis = await analyzeOccupation(occupation);
        return NextResponse.json(analysis);

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze occupation" },
            { status: 500 }
        );
    }
}
