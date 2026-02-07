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

interface SentimentScores {
  frustration_level: number;
  urgency_score: number;
  willingness_to_pay: number;
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
  sentiment?: SentimentScores;
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

    // BUILD THE IMPROVED PROMPTS
    let systemPrompt: string;
    let userPrompt: string;

    if (mode === "solver") {
      systemPrompt = `You are a helpful automation expert analyzing a manual task based on real online discussions.

Write like you're explaining to a friend, not writing a corporate report. Be conversational but smart.

You MUST respond with a JSON object containing these exact fields:
- title: Clear problem name (e.g., 'Weekly Social Media Reporting Chaos')
- domain: The industry/domain
- role: Who typically faces this
- overview: Explain what they're doing and why in 2-3 sentences. Be specific about the steps involved.
- gap: Explain WHY it's still manual in 2-3 sentences. Use evidence from the discussions. Be honest about the real barriers.
- automation: Give THREE specific automation paths, ordered by difficulty. Include exact tools, costs, and what they do. Format as: **Quick Win (No-Code):** [details] **Better Solution (Low-Code):** [details] **Best Solution (Full Automation):** [details]
- action: Give a step-by-step action plan. NOT vague advice. Give the ACTUAL first 5 steps they should do this week. Format as: **This Week:** Day 1: [task] Day 2: [task] etc. **Next Week:** [milestone]
- sentiment: An object with frustration_level (1-10), urgency_score (1-10), and willingness_to_pay (1-10)`;

      userPrompt = `Analyze these discussions about "${query}" and create a detailed, specific analysis.

USER'S TASK: ${query}

REAL DISCUSSIONS FROM REDDIT/TWITTER/QUORA:
${resultsContext}

Respond with valid JSON only, no markdown code blocks.

Example format:
{
  "title": "Weekly Social Media Reporting Chaos",
  "domain": "Marketing",
  "role": "Social Media Manager",
  "overview": "Every Monday morning, you're manually logging into Facebook, Instagram, Twitter, and LinkedIn to pull engagement metrics for last week...",
  "gap": "The platform APIs exist (Meta Graph API, Twitter API v2, LinkedIn Marketing API), but they need developer setup and OAuth tokens that expire every 60 days...",
  "automation": "**Quick Win (No-Code):**\\nUse Buffer's Analytics Export ($15/mo) + Zapier Premium ($50/mo)...\\n\\n**Better Solution (Low-Code):**\\nBuild a Google Apps Script...\\n\\n**Best Solution (Full Automation):**\\nUse Supermetrics ($99/mo)...",
  "action": "**This Week:**\\n\\nDay 1 (Today - 30 min): Sign up for free trials...\\n\\nDay 2 (1 hour): Connect your social accounts...\\n\\n**Next Week:**\\nLet it run on auto-pilot...",
  "sentiment": {
    "frustration_level": 8,
    "urgency_score": 6,
    "willingness_to_pay": 7
  }
}`;

    } else {
      // Builder mode
      systemPrompt = `You are discovering real market problems from online discussions.

Analyze discussions and extract 3 DISTINCT, high-value problems. Make the content specific and actionable, not generic. Write like you're telling a founder friend what you found.

Respond with a JSON array of exactly 3 objects, each with:
- title: Specific problem from discussions (e.g., 'Instagram Creators Can't Track Sponsor ROI')
- domain: Market category based on the problem
- role: Who's struggling (e.g., 'Instagram Influencer', 'SaaS Marketer')
- overview: What people are struggling with in 2-3 sentences. Be specific about their pain.
- gap: Why no good solution exists yet, based on what you see in the discussions.
- automation: What AI/automation opportunity exists. Give 3 concrete product ideas formatted as: **Micro SaaS Opportunity:** [details] **AI Enhancement:** [details] **Marketplace Play:** [details]
- action: First steps to validate and build this. Give a 2-week action plan formatted as: **Week 1 - Validation:** Day 1-2: [task] Day 3-4: [task] **Week 2 - MVP:** Day 1-3: [task] Day 4-5: [task]
- sentiment: An object with frustration_level (1-10), urgency_score (1-10), and willingness_to_pay (1-10)

Make each problem DISTINCT. Don't repeat the same issue 3 times.`;

      userPrompt = `Analyze these discussions about "${query}" and extract 3 distinct problems.

DISCUSSIONS FROM REDDIT/TWITTER/QUORA:
${resultsContext}

Respond with valid JSON array only, no markdown code blocks.

Example format:
[
  {
    "title": "Instagram Creators Can't Track Sponsor ROI",
    "domain": "Creator Economy",
    "role": "Instagram Influencer",
    "overview": "Instagram creators with 10K-100K followers are struggling to show sponsors concrete ROI from paid posts...",
    "gap": "Instagram's API deliberately limits data access to prevent scrapers and protect user privacy...",
    "automation": "**Micro SaaS Opportunity:**\\nBuild a Chrome extension that scrapes Instagram Insights data...\\n\\n**AI Enhancement:**\\nUse GPT-4 Vision to analyze Instagram posts...\\n\\n**Marketplace Play:**\\nCreate a two-sided marketplace...",
    "action": "**Week 1 - Validation:**\\n\\nDay 1-2: Go to these Reddit threads and DM the top 10 commenters...\\n\\n**Week 2 - MVP:**\\nDay 1-3: Use Instagram Basic Display API...",
    "sentiment": {
      "frustration_level": 9,
      "urgency_score": 7,
      "willingness_to_pay": 8
    }
  }
]`;
    }

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
          { role: "user", content: userPrompt },
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
        sentiment: result.sentiment || null,
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