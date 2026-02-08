import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SourceType = "reddit" | "twitter" | "quora";

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  source: SourceType;
}

interface SentimentScores {
  frustration_level: number;
  urgency_score: number;
  willingness_to_pay: number;
}

interface ActionResource {
  type: string;
  title: string;
  url: string;
  platform?: string;
  cost?: string;
}

interface ExistingSolution {
  name: string;
  url: string;
  cost: string;
  description: string;
}

interface BuildOpportunity {
  viable: boolean;
  reason: string;
  search_query: string;
}

interface ActionPlan {
  diy: {
    description: string;
    resources: ActionResource[];
  };
  existing_solutions: ExistingSolution[];
  build_opportunity: BuildOpportunity;
}

async function searchSource(
  apiKey: string,
  query: string,
  source: SourceType,
  mode: string
): Promise<SearchResult[]> {
  let siteFilter = "";
  if (source === "reddit") siteFilter = "site:reddit.com";
  else if (source === "twitter") siteFilter = "site:twitter.com OR site:x.com";
  else if (source === "quora") siteFilter = "site:quora.com";

  const frictionPhrases = mode === "solver"
    ? '("I wish there was" OR "how do I automate" OR "is there a tool")'
    : '("I wish" OR "automate" OR "tool for" OR "still manual")';

  const searchQuery = `${siteFilter} ${query} ${frictionPhrases}`;
  const limit = mode === "builder" 
    ? (source === "reddit" ? 5 : source === "twitter" ? 4 : 3)
    : (source === "reddit" ? 3 : 2);

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
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results = data.data || [];

    return results.map((r: any) => ({
      url: r.url || "",
      title: r.title || "Untitled",
      snippet: (r.markdown || r.description || "").slice(0, 500),
      source,
    }));
  } catch (error) {
    console.error(`Search error for ${source}:`, error);
    return [];
  }
}

async function searchMultipleSources(
  apiKey: string,
  query: string,
  sources: SourceType[],
  mode: string
): Promise<SearchResult[]> {
  const promises = sources.map((s) => searchSource(apiKey, query, s, mode));
  const results = await Promise.all(promises);
  return results.flat();
}

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const query = body.query || "";
    const mode = body.mode || "solver";
    const sources = body.sources || ["reddit"];

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // @ts-ignore
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    // @ts-ignore
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing API keys" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validSources: SourceType[] = ["reddit", "twitter", "quora"];
    const requestedSources = sources.filter((s: string) => 
      validSources.indexOf(s as SourceType) !== -1
    ) as SourceType[];

    const searchResults = await searchMultipleSources(
      FIRECRAWL_API_KEY,
      query,
      requestedSources.length > 0 ? requestedSources : ["reddit"],
      mode
    );

    if (searchResults.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No discussions found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resultsContext = searchResults
      .slice(0, 5)
      .map((r, i) => `[${r.source.toUpperCase()} ${i + 1}]\n${r.title}\n${r.url}\n${r.snippet}`)
      .join("\n\n---\n\n");

    const systemPrompt = mode === "solver"
      ? `You are an automation expert. Respond with valid JSON (no markdown).

Required fields:
- title: Problem name
- domain: Industry
- role: Who faces this
- overview: What they do (2-3 sentences)
- gap: Why still manual (2-3 sentences)
- automation: 3 solutions formatted as **Quick Win:** details **Better:** details **Best:** details
- action: JSON object with this EXACT structure:
{
  "diy": {
    "description": "Build approach",
    "resources": [
      {"type": "tutorial", "title": "...", "url": "https://...", "platform": "YouTube", "cost": "Free"}
    ]
  },
  "existing_solutions": [
    {"name": "Tool", "url": "https://...", "cost": "$X/mo", "description": "What it does"}
  ],
  "build_opportunity": {
    "viable": true,
    "reason": "Market gap",
    "search_query": "suggested query"
  }
}
- sentiment: {"frustration_level": 1-10, "urgency_score": 1-10, "willingness_to_pay": 1-10}`
      : `Extract 3 distinct problems as JSON array. Each with title, domain, role, overview, gap, automation, action (text), sentiment.`;

    const userPrompt = `Analyze: "${query}"\n\nDiscussions:\n${resultsContext}\n\nRespond with valid JSON only.`;

    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiContent = geminiData.choices?.[0]?.message?.content || "";

    const cleanedContent = aiContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Parse error:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisResults = Array.isArray(parsed) ? parsed : [parsed];

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const recordsToInsert = analysisResults.map((result: any, index: number) => {
      let matchingResult = searchResults[0];
      for (const sr of searchResults) {
        if (result.source_url && sr.url === result.source_url) {
          matchingResult = sr;
          break;
        }
      }

      return {
        title: result.title || "",
        domain: result.domain || "",
        role: result.role || "General",
        overview: result.overview || "",
        gap: result.gap || "",
        automation: result.automation || "",
        action: result.action,
        source_type: matchingResult?.source || "reddit",
        source_url: result.source_url || matchingResult?.url || "",
        search_query: query,
        sentiment: result.sentiment || null,
      };
    });

    const { data: insertedData, error: insertError } = await supabase
      .from("curated_problems")
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      console.error("DB error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});