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

        // Build logical summary for the AI
        let expenseSummary = "No expense data available.";

        if (expenseData) {
            const categoryList = Object.entries(expenseData.categoryBreakdown || {})
                .map(([cat, amount]) => `  - ${cat}: ₹${(amount as number).toFixed(2)}`)
                .join("\n");

            const historyLog = expenseData.fullHistory || "No transaction history.";

            const budgets = expenseData.budgets || {};
            const budgetList = Object.entries(budgets).length > 0
                ? Object.entries(budgets).map(([cat, limit]) => `  - ${cat}: ₹${limit}`).join("\n")
                : "  No budgets set.";

            expenseSummary = `
Current Financial Snapshot:
- Total Expenses: ₹${expenseData.totalExpenses?.toFixed(2) || '0.00'}
- Total Transactions: ${expenseData.totalTransactions || 0}
- This Month's Total: ₹${expenseData.thisMonthTotal?.toFixed(2) || '0.00'}
- This Month's Transactions: ${expenseData.thisMonthTransactions || 0}

Category Breakdown:
${categoryList || '  No categories yet'}

Monthly Budget Limits:
${budgetList}

Monthly Recurring Commitments:
${expenseData.recurringList || "  No recurring expenses set."}

Monthly Income History:
${expenseData.incomes || "  No income data recorded."}

Full Transaction History (Latest 100 items):
${historyLog}
`;
        }

        const systemPrompt = `You are CoinTrack AI, a helpful financial assistant for CoinTrack app.

IMPORTANT: You have access to the user's REAL expense data. Use ONLY this data when answering questions about their spending. Do NOT make up any numbers or fake data.

${expenseSummary}

Your role:
- Answer questions about their ACTUAL spending (use the data above)
- Provide budgeting and saving tips
- Analyze their spending patterns based on REAL data
- Be concise, accurate, and helpful

If the user has no expenses or the data shows ₹0, tell them to add expenses first.
Use markdown formatting for lists when helpful.`;

        const userPrompt = `User: ${context?.user || 'User'}
Time: ${context?.time || new Date().toLocaleString()}

Question: ${message}`;

        console.log("Calling DeepSeek R1 with real data...");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "CoinTrack Chat"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-r1-0528:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error("OpenRouter API Error:", response.status, responseText);
            const errorData = JSON.parse(responseText);
            return NextResponse.json({
                response: `⚠️ AI service error: ${errorData.error?.message || 'Unknown error'}`
            });
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            return NextResponse.json({ response: "⚠️ Error parsing AI response." });
        }

        let aiResponse = data.choices?.[0]?.message?.content;

        if (!aiResponse || aiResponse.trim() === "") {
            // Check for reasoning fallback if content is empty
            const reasoning = data.choices?.[0]?.message?.reasoning;
            if (reasoning) {
                aiResponse = "I've analyzed your data. " + reasoning.substring(0, 500) + "...";
            } else {
                return NextResponse.json({ response: "I couldn't generate a response. Please try again." });
            }
        }

        // Clean up response - remove thinking tags
        aiResponse = aiResponse.trim();
        aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        return NextResponse.json({ response: aiResponse });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({
            response: `⚠️ Connection failed: ${error.message}. Please try again.`
        });
    }
}
