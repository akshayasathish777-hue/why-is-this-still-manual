import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SourceType = "reddit" | "twitter" | "quora";

interface FirecrawlResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
}

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  source: SourceType;
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

// Search a single source via Firecrawl
async function searchSource(
  apiKey: string,
  query: string,
  source: SourceType,
  mode: "solver" | "builder"
): Promise<SearchResult[]> {
  // Build site filter based on source
  let siteFilter: string;
  switch (source) {
    case "reddit":
      siteFilter = "site:reddit.com";
      break;
    case "twitter":
      siteFilter = "site:twitter.com OR site:x.com";
      break;
    case "quora":
      siteFilter = "site:quora.com";
      break;
  }

  // High-friction phrases for discovery
  const frictionPhrases =
    mode === "solver"
      ? `("I wish there was" OR "how do I automate" OR "is there a tool")`
      : `("I wish" OR "automate" OR "tool for" OR "still manual" OR "why is there no")`;

  const searchQuery = `${siteFilter} ${query} ${frictionPhrases}`;

  // Limit based on mode and source
  let limit: number;
  if (mode === "builder") {
    limit = source === "reddit" ? 5 : source === "twitter" ? 4 : 3;
  } else {
    limit = source === "reddit" ? 3 : 2;
  }

  console.log(`[searchSource] Searching ${source}: ${searchQuery.slice(0, 100)}...`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit,
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
    });

    if (!response.ok) {
      console.error(`[searchSource] ${source} search failed:`, response.status);
      return [];
    }

    const data = await response.json();
    const results: FirecrawlResult[] = data.data || [];

    console.log(`[searchSource] Found ${results.length} results from ${source}`);

    return results.map((r) => ({
      url: r.url,
      title: r.title || "Untitled",
      snippet: r.markdown?.slice(0, 500) || r.description || "",
      source,
    }));
  } catch (error) {
    console.error(`[searchSource] ${source} search error:`, error);
    return [];
  }
}

// Search multiple sources in parallel
async function searchMultipleSources(
  apiKey: string,
  query: string,
  sources: SourceType[],
  mode: "solver" | "builder"
): Promise<SearchResult[]> {
  const searchPromises = sources.map((source) =>
    searchSource(apiKey, query, source, mode)
  );

  const results = await Promise.all(searchPromises);
  return results.flat();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mode = "solver", sources = ["reddit"] } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate sources
    const validSources: SourceType[] = ["reddit", "twitter", "quora"];
    const requestedSources: SourceType[] = (sources as string[])
      .filter((s): s is SourceType => validSources.includes(s as SourceType));

    if (requestedSources.length === 0) {
      requestedSources.push("reddit"); // Default fallback
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

    console.log(`[analyze-problem] Starting analysis for query: "${query}" in mode: ${mode}, sources: ${requestedSources.join(", ")}`);

    // Step 1: Search multiple sources via Firecrawl
    console.log("[analyze-problem] Step 1: Searching across sources...");
    const searchResults = await searchMultipleSources(
      FIRECRAWL_API_KEY,
      query,
      requestedSources,
      mode
    );

    if (searchResults.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No discussions found across any sources. Try different keywords.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-problem] Found ${searchResults.length} total results`);

    // Build context from search results
    const resultsContext = searchResults
      .slice(0, 5)
      .map(
        (r, i) =>
          `[${r.source.toUpperCase()} - Thread ${i + 1}]\nTitle: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet.slice(0, 1000)}`
      )
      .join("\n\n---\n\n");

    // Step 2: Analyze with Gemini via Lovable AI Gateway
    console.log("[analyze-problem] Step 2: Analyzing with Gemini...");

    const systemPrompt =
      mode === "solver"
        ? `You are an expert analyst who identifies manual workflow problems and automation opportunities.
           Analyze the discussions from Reddit, Twitter/X, and Quora provided and extract insights about a specific manual workflow problem.
           
           You MUST respond with a JSON object containing these exact fields:
           - title: A clear, concise title for the problem (max 60 chars)
           - domain: The industry/domain (e.g., "Healthcare", "Finance", "HR", "Sales")
           - role: Who typically faces this problem (e.g., "Operations Manager", "Data Analyst")
           - overview: Summary of the problem and its impact (2-3 sentences)
           - gap: Why this is still done manually - root causes. Reference specific pain points from the discussions. (2-3 bullet points as a string)
           - automation: How AI/automation could solve this. Mention specific tools like GPT-4, Zapier, Airtable, etc. (2-3 bullet points as a string)
           - action: Concrete Day-1 next steps to automate - be specific, not vague. (2-3 numbered steps as a string)`
        : `You are an expert at discovering real-world problems that could be solved with software.
           Analyze the discussions from Reddit, Twitter/X, and Quora and identify 3 distinct problems people are struggling with.
           
           Respond with a JSON array of exactly 3 objects, each with:
           - title: A clear, concise problem title (max 60 chars)
           - domain: The market category
           - role: Inferred user persona (e.g., 'SaaS Marketer', 'Small Business Owner')
           - overview: What people are struggling with (2-3 sentences)
           - gap: Why no good solution exists yet based on thread analysis
           - automation: AI opportunity based on expressed needs in the threads
           - action: First step to validate/build this solution
           
           Make each problem distinct and valuable. Focus on problems where AI could provide a breakthrough solution.`;

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
            content: `Analyze these discussions about "${query}" and identify manual workflow problems:\n\n${resultsContext}\n\nRespond with valid JSON only, no markdown code blocks.`,
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

      // Add source URLs from search results
      analysisResults = analysisResults.map((result: AnalysisResult, index: number) => {
        // Try to find a matching source URL
        const matchingResult = searchResults[index] || searchResults[0];
        return {
          ...result,
          source_url: matchingResult?.url || "",
        };
      });
    } catch (parseError) {
      console.error("[analyze-problem] Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-problem] Parsed ${analysisResults.length} analysis results`);

    // Step 3: Store in Supabase with correct source attribution
    console.log("[analyze-problem] Step 3: Storing in database...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const recordsToInsert = analysisResults.map((result, index) => {
      // Find the source type for this result
      const matchingResult = searchResults.find((sr) =>
        result.source_url ? sr.url === result.source_url : false
      ) || searchResults[index] || searchResults[0];

      return {
        title: result.title,
        domain: result.domain,
        role: result.role || "General",
        overview: result.overview,
        gap: result.gap,
        automation: result.automation,
        action: result.action,
        source_type: matchingResult?.source || "reddit",
        source_url: result.source_url || matchingResult?.url || "",
        search_query: query,
      };
    });

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

    // Return sources with their types for trust signal
    const sourcesWithTypes = searchResults.slice(0, 5).map((r) => ({
      url: r.url,
      title: r.title,
      source: r.source,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: insertedData,
        sources: sourcesWithTypes,
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
