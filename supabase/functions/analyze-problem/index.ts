import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FirecrawlResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
}

interface AnalysisResult {
  title: string;
  domain: string;
  role: string;
  overview: string;
  gap: string;
  automation: string;
  action: string;
  source_url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mode = "solver" } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API keys
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Lovable API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-problem] Starting analysis for query: "${query}" in mode: ${mode}`);

    // Step 1: Search Reddit via Firecrawl with high-friction phrase detection
    console.log("[analyze-problem] Step 1: Searching Reddit via Firecrawl...");
    
    // Build search query with high-friction phrases for better signal
    const highFrictionPhrases = mode === "solver"
      ? `"I wish there was" OR "how do I automate" OR "is there a tool"`
      : `("I wish" OR "automate" OR "tool for" OR "still manual" OR "why is there no")`;
    
    const searchQuery = `site:reddit.com ${query} ${highFrictionPhrases}`;
    console.log(`[analyze-problem] Search query: ${searchQuery}`);
    
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: mode === "builder" ? 7 : 5,
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error("[analyze-problem] Firecrawl error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to search Reddit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlData = await firecrawlResponse.json();
    const searchResults: FirecrawlResult[] = firecrawlData.data || [];
    console.log(`[analyze-problem] Found ${searchResults.length} Reddit results`);

    if (searchResults.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No Reddit discussions found for this topic" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare context from Reddit results
    const redditContext = searchResults
      .slice(0, 3)
      .map((r, i) => `[Source ${i + 1}]: ${r.title}\nURL: ${r.url}\n${r.markdown?.slice(0, 1500) || r.description || ""}`)
      .join("\n\n---\n\n");

    // Step 2: Analyze with Gemini via Lovable AI Gateway
    console.log("[analyze-problem] Step 2: Analyzing with Gemini...");

    const systemPrompt = mode === "solver"
      ? `You are an expert analyst who identifies manual workflow problems and automation opportunities.
         Analyze the Reddit discussions provided and extract insights about a specific manual workflow problem.
         
         You MUST respond with a JSON object containing these exact fields:
         - title: A clear, concise title for the problem (max 60 chars)
         - domain: The industry/domain (e.g., "Healthcare", "Finance", "HR", "Sales")
         - role: Who typically faces this problem (e.g., "Operations Manager", "Data Analyst")
         - overview: Summary of the problem and its impact (2-3 sentences)
         - gap: Why this is still done manually - root causes (2-3 bullet points as a string)
         - automation: How AI/automation could solve this (2-3 bullet points as a string)
         - action: Concrete next steps to automate (2-3 numbered steps as a string)`
      : `You are an expert at discovering real-world problems that could be solved with software.
         Analyze the Reddit discussions and identify 3 distinct problems people are complaining about.
         
         Respond with a JSON array of 3 objects, each with:
         - title: A clear, concise problem title (max 60 chars)
         - domain: The industry/domain
         - role: Who faces this problem
         - overview: Brief description of the pain point
         - gap: Why it's still manual
         - automation: How it could be automated
         - action: First step to solve it`;

    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze these Reddit discussions about "${query}" and identify manual workflow problems:\n\n${redditContext}\n\nRespond with valid JSON only, no markdown code blocks.`,
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await geminiResponse.text();
      console.error("[analyze-problem] Gemini error:", status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to analyze with AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiContent = geminiData.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      console.error("[analyze-problem] No content in Gemini response");
      return new Response(
        JSON.stringify({ success: false, error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-problem] Raw AI response:", aiContent.slice(0, 500));

    // Parse AI response (strip markdown code blocks if present)
    let analysisResults: AnalysisResult[];
    try {
      const cleanedContent = aiContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      const parsed = JSON.parse(cleanedContent);
      
      // Normalize to array
      analysisResults = Array.isArray(parsed) ? parsed : [parsed];
      
      // Add source URL from first Reddit result
      analysisResults = analysisResults.map((result: AnalysisResult) => ({
        ...result,
        source_url: searchResults[0]?.url || "",
      }));
    } catch (parseError) {
      console.error("[analyze-problem] Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-problem] Parsed ${analysisResults.length} analysis results`);

    // Step 3: Store in Supabase
    console.log("[analyze-problem] Step 3: Storing in database...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const recordsToInsert = analysisResults.map((result) => ({
      title: result.title,
      domain: result.domain,
      role: result.role || "General",
      overview: result.overview,
      gap: result.gap,
      automation: result.automation,
      action: result.action,
      source_type: "reddit",
      source_url: result.source_url,
      search_query: query,
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from("curated_problems")
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      console.error("[analyze-problem] Database insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-problem] Successfully stored ${insertedData?.length} records`);

    return new Response(
      JSON.stringify({
        success: true,
        data: insertedData,
        sources: searchResults.slice(0, 3).map((r) => ({ url: r.url, title: r.title })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[analyze-problem] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
