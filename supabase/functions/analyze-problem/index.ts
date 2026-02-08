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
    // Authentication: Validate JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to validate
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

    const body = await req.json();
    const query = body.query || "";
    const mode = body.mode || "solver";
    const sources = body.sources || ["reddit"];

    // Input validation
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (query.length > 500) {
      return new Response(
        JSON.stringify({ success: false, error: "Query too long (max 500 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // @ts-ignore
    // SAFE KEY FETCHING
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") || "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // VALIDATION CHECK
    if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY) {
      console.error("CRITICAL ERROR: Keys are missing in Supabase Secrets");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "System keys not configured. Please add FIRECRAWL_API_KEY and LOVABLE_API_KEY to Supabase Secrets." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
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
  ? `You are an automation expert analyzing a manual workflow. Respond with ONLY valid JSON (no markdown, no code blocks, no explanations).

CRITICAL: The "action" field MUST be a JSON object, NOT a string.

Structure:
{
  "title": "Short problem name",
  "domain": "Industry category",
  "role": "Who faces this problem",
  "overview": "What they're manually doing (2-3 sentences with specific steps)",
  "gap": "Why it's still manual (2-3 sentences with real barriers from discussions)",
  "automation": "**Quick Win (No-Code):** Use [Tool X] at $Y/mo to [specific workflow]\\n\\n**Better (Low-Code):** Use [Approach] with [Tech] to [specific workflow]\\n\\n**Best (Full Automation):** Use [Enterprise Tool] at $Z/mo for [complete solution]",
  "action": {
    "diy": {
      "description": "How to build it yourself with specific tools",
      "resources": [
        {"type": "tutorial", "title": "Actual tutorial name", "url": "https://youtube.com/specific-video", "platform": "YouTube", "cost": "Free"},
        {"type": "tool", "title": "Make.com", "url": "https://make.com", "cost": "$9/mo"},
        {"type": "template", "title": "Template name", "url": "https://real-url.com", "platform": "Notion"}
      ]
    },
    "existing_solutions": [
      {"name": "Real Tool Name", "url": "https://actualtool.com", "cost": "$49/mo", "description": "Specific feature it provides"}
    ],
    "build_opportunity": {
      "viable": true,
      "reason": "Specific market gap based on discussions",
      "search_query": "relevant search for builder mode"
    }
  },
  "sentiment": {"frustration_level": 8, "urgency_score": 7, "willingness_to_pay": 6}
}

IMPORTANT RULES:
1. "action" MUST be a JSON object, never a string
2. Include 2-3 real resources with actual URLs (search YouTube/Google for real tutorials)
3. Include 2-3 real existing solutions with actual pricing
4. Use real tool names (Make.com, Zapier, n8n, etc.)
5. DO NOT use placeholder URLs like "https://..."
6. DO NOT wrap response in markdown code blocks`
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

    // Ensure we have a valid URL before creating the client
    const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "");

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