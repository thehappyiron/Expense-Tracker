import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message = body.message || "";
        const context = body.context;
        const expenseData = context?.expenseData;

        const openRouterKey = process.env.OPENROUTER_API_KEY;

        if (!openRouterKey) {
            return NextResponse.json({
                response: "⚠️ API key not configured. Please add OPENROUTER_API_KEY to .env.local"
            });
        }

        // Build logical summary for the AI - TRIMMED for stability
        let expenseSummary = "No expense data available.";

        if (expenseData) {
            const categoryList = Object.entries(expenseData.categoryBreakdown || {})
                .slice(0, 10) // Limit categories
                .map(([cat, amount]) => `  - ${cat}: ₹${(amount as number).toFixed(2)}`)
                .join("\n");

            // Only send latest 10 items instead of 30-100 to avoid context issues on free tier
            let historyLines = (expenseData.fullHistory || "").split("\n").filter(Boolean);
            const historyLog = historyLines.slice(0, 10).join("\n") || "No transaction history.";

            const budgets = expenseData.budgets || {};
            const budgetList = Object.entries(budgets).length > 0
                ? Object.entries(budgets).slice(0, 5).map(([cat, limit]) => `  - ${cat}: ₹${limit}`).join("\n")
                : "  No budgets set.";

            expenseSummary = `
Current Financial Snapshot:
- Total Expenses: ₹${expenseData.totalExpenses?.toFixed(2) || '0.00'}
- This Month's Total: ₹${expenseData.thisMonthTotal?.toFixed(2) || '0.00'}

Category Breakdown (Top 10):
${categoryList || '  No categories yet'}

Budget Limits:
${budgetList}

Recurring Expenses:
${expenseData.recurringList || "  No recurring expenses found."}

Income History:
${expenseData.incomes || "  No income records found."}

Recent Transaction History (Latest 10):
${historyLog}
`;
        }

        const userName = context?.user || "User";
        const firstName = userName.split(" ")[0];

        const systemPrompt = `You are CoinTrack AI, a helpful financial assistant for CoinTrack app.
IMPORTANT: You have access to the user's REAL expense data. Use ONLY this data when answering questions about their spending.

${expenseSummary}

Your role:
- Address the user as "${firstName}" (their first name) in your greetings or when appropriate.
- Answer questions about their ACTUAL spending
- Provide budgeting and saving tips
- Be concise, accurate, and helpful

If the user has no expenses, tell them to add expenses first.`;

        const userPrompt = `Question: ${message}`;

        let lastError = "";
        let retryCount = 0;
        const maxRetries = 1; // Try at most twice

        while (retryCount <= maxRetries) {
            try {
                process.stdout.write(`Calling Google Gemma 3 27B (free) (Attempt ${retryCount + 1})...\n`);

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterKey.trim()}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "CoinTrack Chat"
                    },
                    body: JSON.stringify({
                        model: "google/gemma-3-27b-it:free",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        max_tokens: 1000,
                        temperature: 0.7
                    }),
                    signal: AbortSignal.timeout(30000) // 30s timeout
                });

                const responseText = await response.text();

                if (!response.ok) {
                    console.error(`OpenRouter Error (Attempt ${retryCount + 1}):`, response.status, responseText);
                    try {
                        const errorData = JSON.parse(responseText);
                        lastError = errorData.error?.message || errorData.error || responseText;
                    } catch (e) {
                        lastError = responseText || "Empty response";
                    }

                    if (response.status === 429 || response.status >= 500) {
                        retryCount++;
                        if (retryCount <= maxRetries) {
                            await new Promise(r => setTimeout(r, 1500)); // Wait before retry
                            continue;
                        }
                    }

                    return NextResponse.json({ response: `⚠️ AI service error: ${lastError}` });
                }

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    return NextResponse.json({ response: "⚠️ Error parsing AI response." });
                }

                let aiResponse = data.choices?.[0]?.message?.content;

                if (!aiResponse || aiResponse.trim() === "") {
                    const reasoning = data.choices?.[0]?.message?.reasoning;
                    if (reasoning) {
                        aiResponse = reasoning.substring(0, 500) + "...";
                    } else {
                        // Sometimes content is empty but choice exists
                        retryCount++;
                        if (retryCount <= maxRetries) continue;
                        return NextResponse.json({ response: "I couldn't generate a response. Please try again." });
                    }
                }

                // Clean up response - remove thinking tags
                aiResponse = aiResponse.trim();
                aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

                return NextResponse.json({ response: aiResponse });

            } catch (err: any) {
                console.error(`Fetch error (Attempt ${retryCount + 1}):`, err.message);
                lastError = err.message;
                retryCount++;
                if (retryCount <= maxRetries) {
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                return NextResponse.json({ response: `⚠️ Connection failed: ${err.message}` });
            }
        }

        return NextResponse.json({ response: `⚠️ Final error: ${lastError}` });

    } catch (error: any) {
        console.error("Critical Chat API Error:", error);
        return NextResponse.json({
            response: `⚠️ System error: ${error.message}`
        });
    }
}
