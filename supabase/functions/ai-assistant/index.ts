import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL = "gemini-3.6-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function normalize(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[„”«»?!.,;:"'`()\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordsFrom(text: string) {
  const stop = new Set([
    "ce", "este", "sunt", "cine", "care", "despre", "spune", "spune-mi",
    "imi", "vreau", "as", "sa", "un", "o", "in", "din", "de", "la", "cu",
    "si", "pentru", "pe", "mai", "poti", "explica", "explici", "te", "rog",
    "face", "fa", "fami", "arata", "material", "site", "siteul", "site-ul",
  ]);

  return [...new Set(
    normalize(text)
      .split(" ")
      .filter((word) => word.length >= 3 && !stop.has(word)),
  )].slice(0, 12);
}

function scoreText(text: string, question: string, keywords: string[]) {
  const nText = normalize(text);
  const nQuestion = normalize(question);
  if (!nText) return 0;

  let score = 0;
  for (const keyword of keywords) {
    if (nText.includes(keyword)) score += keyword.length >= 6 ? 5 : 3;
  }

  if (nQuestion.length >= 4 && nText.includes(nQuestion)) score += 30;
  return score;
}

function relevantExcerpt(text: string, keywords: string[], maxChars = 2600) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= maxChars) return clean;

  const normalized = normalize(clean);
  let bestIndex = -1;

  for (const keyword of keywords) {
    const index = normalized.indexOf(keyword);
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) bestIndex = index;
  }

  if (bestIndex === -1) return clean.slice(0, maxChars) + "…";

  // Indexul din textul normalizat este suficient de apropiat pentru alegerea ferestrei.
  const start = Math.max(0, bestIndex - 500);
  const end = Math.min(clean.length, start + maxChars);
  return (start > 0 ? "…" : "") + clean.slice(start, end) + (end < clean.length ? "…" : "");
}

type Source = {
  score: number;
  type: string;
  title: string;
  author?: string;
  content: string;
};

async function searchSite(supabase: any, question: string): Promise<Source[]> {
  const keywords = keywordsFrom(question);
  const results: Source[] = [];

  // AUTORI
  try {
    const { data, error } = await supabase
      .from("autori")
      .select("id, nume, descriere, categorie")
      .limit(150);

    if (error) console.error("Căutare autori:", error);

    for (const autor of data || []) {
      const searchable = `${autor.nume || ""} ${autor.categorie || ""} ${autor.descriere || ""}`;
      let score = scoreText(searchable, question, keywords);
      if (normalize(question).includes(normalize(autor.nume || "")) && autor.nume) score += 35;

      if (score > 0) {
        results.push({
          score,
          type: "autor",
          title: autor.nume || "Autor",
          content: autor.descriere || "",
        });
      }
    }
  } catch (error) {
    console.error("Autori:", error);
  }

  // OPERE + TEXT EXTRAS DIN PDF-URI
  try {
    const [{ data: works, error: worksError }, { data: authors, error: authorsError }] = await Promise.all([
      supabase
        .from("opere")
        .select("id, autor_id, titlu, continut_rezumat, continut_analiza_literara, continut_valori_morale, continut_caracterizare")
        .limit(250),
      supabase.from("autori").select("id, nume").limit(150),
    ]);

    if (worksError) console.error("Căutare opere:", worksError);
    if (authorsError) console.error("Autori opere:", authorsError);

    const authorMap = new Map((authors || []).map((a: any) => [String(a.id), a.nume || ""]));

    const fields = [
      ["Rezumat", "continut_rezumat"],
      ["Analiză literară", "continut_analiza_literara"],
      ["Valori morale", "continut_valori_morale"],
      ["Caracterizare", "continut_caracterizare"],
    ] as const;

    for (const work of works || []) {
      const author = authorMap.get(String(work.autor_id)) || "";
      const titleMatch = normalize(question).includes(normalize(work.titlu || "")) && work.titlu;

      for (const [label, field] of fields) {
        const fullText = String(work[field] || "");
        const searchable = `${work.titlu || ""} ${author} ${label} ${fullText}`;
        let score = scoreText(searchable, question, keywords);
        if (titleMatch) score += 35;
        if (normalize(question).includes(normalize(label))) score += 12;

        if (score > 0 && fullText) {
          results.push({
            score,
            type: `operă • ${label}`,
            title: work.titlu || "Operă",
            author,
            content: relevantExcerpt(fullText, keywords),
          });
        }
      }

      // Dacă opera există dar încă nu are text indexat, păstrăm măcar titlul/autorul.
      if (titleMatch && !fields.some(([, field]) => Boolean(work[field]))) {
        results.push({
          score: 30,
          type: "operă",
          title: work.titlu || "Operă",
          author,
          content: "PDF-urile acestei opere nu au fost încă indexate pentru Profesorul AI.",
        });
      }
    }
  } catch (error) {
    console.error("Opere:", error);
  }

  // LIMBA ROMÂNĂ + TEXT EXTRAS DIN PDF
  try {
    const [{ data: materials, error: materialsError }, { data: chapters, error: chaptersError }] = await Promise.all([
      supabase
        .from("limba_materiale")
        .select("id, capitol_id, titlu, descriere, continut_ai")
        .limit(300),
      supabase.from("limba_capitole").select("id, titlu, descriere").limit(200),
    ]);

    if (materialsError) console.error("Materiale limbă:", materialsError);
    if (chaptersError) console.error("Capitole limbă:", chaptersError);

    const chapterMap = new Map((chapters || []).map((c: any) => [String(c.id), c]));

    for (const material of materials || []) {
      const chapter = chapterMap.get(String(material.capitol_id));
      const fullText = String(material.continut_ai || "");
      const searchable = [
        material.titlu,
        material.descriere,
        chapter?.titlu,
        chapter?.descriere,
        fullText,
      ].filter(Boolean).join(" ");

      let score = scoreText(searchable, question, keywords);
      if (normalize(question).includes(normalize(material.titlu || "")) && material.titlu) score += 30;
      if (chapter?.titlu && normalize(question).includes(normalize(chapter.titlu))) score += 20;

      if (score > 0) {
        results.push({
          score,
          type: "Limba română",
          title: material.titlu || chapter?.titlu || "Material",
          content: fullText
            ? relevantExcerpt(fullText, keywords)
            : (material.descriere || chapter?.descriere || "Materialul nu are încă text PDF indexat."),
        });
      }
    }
  } catch (error) {
    console.error("Limba română:", error);
  }

  // INDEX GENERAL: toate PDF/DOCX/TXT procesate la upload
  try {
    const { data, error } = await supabase
      .from("documente_ai")
      .select("id, source_type, source_id, titlu, categorie, nume_fisier, tip_fisier, text_extras, metadata")
      .limit(500);

    if (error) {
      // Compatibil cu instalările unde migrarea documente_ai nu a fost rulată încă.
      console.warn("Index general documente_ai:", error.message || error);
    }

    for (const doc of data || []) {
      const fullText = String(doc.text_extras || "");
      const searchable = [
        doc.titlu,
        doc.categorie,
        doc.nume_fisier,
        doc.tip_fisier,
        fullText,
      ].filter(Boolean).join(" ");

      let score = scoreText(searchable, question, keywords);
      if (doc.titlu && normalize(question).includes(normalize(doc.titlu))) score += 30;
      if (doc.categorie && normalize(question).includes(normalize(doc.categorie))) score += 10;

      if (score > 0 && fullText) {
        results.push({
          score,
          type: doc.categorie ? `document • ${doc.categorie}` : "document",
          title: doc.titlu || doc.nume_fisier || "Document",
          content: relevantExcerpt(fullText, keywords),
        });
      }
    }
  } catch (error) {
    console.error("Documente AI:", error);
  }

  results.sort((a, b) => b.score - a.score);

  const unique = new Map<string, Source>();
  for (const result of results) {
    const key = `${result.type}:${normalize(result.title)}:${normalize(result.content).slice(0, 120)}`;
    if (!unique.has(key)) unique.set(key, result);
    if (unique.size >= 6) break;
  }

  return [...unique.values()];
}

function buildContext(sources: Source[]) {
  return sources.map((source, index) => {
    const author = source.author ? `\nAutor: ${source.author}` : "";
    return `SURSA ${index + 1}\nTip: ${source.type}\nTitlu: ${source.title}${author}\nConținut:\n${source.content}`;
  }).join("\n\n---\n\n");
}

function localFallback(sources: Source[]) {
  if (!sources.length) {
    return "Nu am găsit informații despre acest subiect în materialele site-ului.";
  }

  const source = sources[0];
  const author = source.author ? `, de ${source.author}` : "";
  const excerpt = String(source.content || "").trim();

  if (!excerpt) {
    return `Am găsit „${source.title}”${author}, dar materialul nu conține încă text indexat pentru Profesorul AI.`;
  }

  if (excerpt.includes("nu au fost încă indexate") || excerpt.includes("nu are încă text PDF indexat")) {
    return `Am găsit „${source.title}”${author}, dar PDF-ul trebuie indexat din panoul Admin înainte să îl pot citi.`;
  }

  const shortExcerpt = excerpt.length > 1100 ? excerpt.slice(0, 1100).trim() + "…" : excerpt;
  return `Am găsit informația în materialul „${source.title}”${author}. Modulul AI este temporar indisponibil, dar acesta este fragmentul relevant din material:\n\n${shortExcerpt}`;
}

async function callGemini(url: string, apiKey: string, body: unknown) {
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  };

  let response = await fetch(url, options);
  if (response.ok) return response;

  if ([429, 500, 502, 503, 504].includes(response.status)) {
    let delay = 1500;
    const retryAfter = Number(response.headers.get("retry-after"));
    if (Number.isFinite(retryAfter) && retryAfter > 0 && retryAfter <= 5) delay = retryAfter * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    response = await fetch(url, options);
  }

  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metodă neacceptată." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Trebuie să fii autentificat pentru a folosi Profesorul AI." }, 401);
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ answer: "Profesorul AI nu este configurat momentan.", temporary_error: true });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return json({ error: "Sesiunea a expirat. Autentifică-te din nou." }, 401);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Cerere invalidă." }, 400);
    }

    const incoming = Array.isArray(body?.messages) ? body.messages.slice(-4) : [];
    const lastUserMessage = [...incoming].reverse().find((m: any) => m?.role !== "assistant" && String(m?.content || "").trim());
    const question = String(lastUserMessage?.content || "").trim();

    if (!question) return json({ error: "Mesajul este gol." }, 400);

    const sources = await searchSite(supabase, question);
    const context = buildContext(sources);
    const fallback = localFallback(sources);

    // Profesorul răspunde numai din materialele site-ului.
    // Dacă nu găsim surse, nu consumăm o cerere Gemini.
    if (!sources.length) {
      return json({
        answer: "Nu am găsit informații despre acest subiect în materialele site-ului.",
        source: "site",
      });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return json({ answer: fallback, source: "site", temporary_error: true });
    }

    const systemPrompt = `
Ești Profesorul AI al unui site educațional de Limba și literatura română.

Răspunde EXCLUSIV pe baza surselor de mai jos. Nu completa golurile din cunoștințe generale.
Dacă sursele nu susțin răspunsul cerut, spune clar că materialele site-ului nu conțin suficiente informații.

SURSE DIN SITE:
${context}

REGULI:
- Răspunde numai în limba română.
- Pentru întrebări simple: maximum 2-4 paragrafe scurte.
- Folosește informația relevantă, nu copia fragmente lungi fără rost.
- Nu inventa citate, episoade, personaje, definiții sau concluzii.
- Nu afișa id-uri, căi storage, timestamp-uri sau structura bazei de date.
- Dacă elevul cere rezumat, analiză, caracterizare sau valori morale, folosește doar sursa corespunzătoare disponibilă.
- Dacă există mai multe surse, combină-le numai când răspunsul o cere.
- Nu începe cu salutări.
- Nu solicita date personale.
`.trim();

    const cleanMessages = incoming
      .map((m: any) => {
        // Include întrebarea de 1200 de caractere și textul de studiu de 6000,
        // împreună cu instrucțiunile adăugate de interfață.
        const text = String(m?.content || "").trim().slice(0, 8000);
        if (!text) return null;
        return { role: m?.role === "assistant" ? "model" : "user", parts: [{ text }] };
      })
      .filter(Boolean);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    let response: Response;
    try {
      response = await callGemini(url, geminiApiKey, {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: cleanMessages,
        generationConfig: { temperature: 0.15, maxOutputTokens: 4096 },
      });
    } catch (error) {
      console.error("Gemini network:", error);
      return json({ answer: fallback, source: "site", temporary_error: true });
    }

    if (!response.ok) {
      const details = await response.text();
      console.error(`Gemini ${response.status}:`, details);
      return json({
        answer: fallback,
        source: "site",
        temporary_error: true,
        reason: response.status === 429 ? "rate_limit" : "gemini_error",
      });
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const answer = candidate?.content?.parts
      ?.map((part: any) => typeof part?.text === "string" ? part.text : "")
      .join("")
      .trim() || "";

    if (!answer) {
      return json({ answer: fallback, source: "site", temporary_error: true });
    }

    return json({
      answer,
      source: "site+gemini",
      sources_used: sources.slice(0, 3).map((s) => ({ type: s.type, title: s.title, author: s.author || null })),
      finish_reason: candidate?.finishReason ?? null,
    });
  } catch (error) {
    console.error("ai-assistant fatal:", error);
    return json({ answer: "Profesorul AI a întâmpinat o problemă temporară.", temporary_error: true });
  }
});
