/**
 * Small BM25 keyword retriever. Used by the in-memory demo workspace, where
 * there is no OpenAI key to embed with; live mode uses pgvector instead.
 */

const STOPWORDS = new Set(
  "a an and are as at be but by can could do does did for from get got have has how i if in is it its me my of on or our so that the their them there these they this to us was we what when where which who why will with would you your yours i'm im i'd id offer offers provide provides need want tell know about any anything please also like just ok okay take takes should shall may might must come coming today tomorrow now soon still really go going able possible someone somebody anyone back help way make sure good long".split(
    " ",
  ),
);

// Folds common phrasings onto the vocabulary used in business documents.
const SYNONYMS: Record<string, string> = {
  cost: "price",
  costs: "price",
  pricing: "price",
  prices: "price",
  fee: "price",
  fees: "price",
  much: "price",
  charge: "price",
  expensive: "price",
  hour: "hours",
  open: "hours",
  opening: "hours",
  close: "hours",
  closed: "hours",
  saturday: "saturday",
  weekend: "saturday",
  kid: "children",
  kids: "children",
  child: "children",
  son: "children",
  daughter: "children",
  toddler: "children",
  invisalign: "aligner",
  aligners: "aligner",
  braces: "aligner",
  straighten: "aligner",
  crooked: "aligner",
  whiten: "whitening",
  white: "whitening",
  bleaching: "whitening",
  nervous: "anxiety",
  anxious: "anxiety",
  scared: "anxiety",
  afraid: "anxiety",
  fear: "anxiety",
  sedation: "anxiety",
  toothache: "emergency",
  pain: "emergency",
  hurts: "emergency",
  urgent: "emergency",
  broke: "broken",
  chipped: "broken",
  book: "booking",
  appointment: "booking",
  schedule: "booking",
  reschedule: "booking",
  park: "parking",
  insurances: "insurance",
  ppo: "insurance",
  covered: "insurance",
  coverage: "insurance",
  finance: "financing",
  pay: "payment",
  paying: "payment",
  payments: "payment",
  installments: "financing",
  monthly: "financing",
  implants: "implant",
  crowns: "crown",
  cleanings: "cleaning",
  checkup: "cleaning",
  "check-up": "cleaning",
  located: "address",
  location: "address",
  where: "address",
  phone: "contact",
  number: "contact",
  call: "contact",
  email: "contact",
  cancel: "cancellation",
  late: "cancellation",
  spanish: "languages",
  portuguese: "languages",
  speak: "languages",
};

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9$][a-z0-9'$-]*/g) ?? [])
    .map((t) => t.replace(/'s$/, ""))
    .filter((t) => !STOPWORDS.has(t))
    .map((t) => stem(SYNONYMS[t] ?? t));
}

function stem(t: string) {
  if (t.length > 5 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 4 && t.endsWith("ies")) return `${t.slice(0, -3)}y`;
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

export type LexicalDoc = { id: string; text: string };

export function bm25Search<T extends LexicalDoc>(docs: T[], query: string, k = 5) {
  const qTerms = [...new Set(tokenize(query))];
  if (!qTerms.length || !docs.length) return [];

  const tokenised = docs.map((d) => tokenize(d.text));
  const avgLen = tokenised.reduce((s, t) => s + t.length, 0) / tokenised.length;
  const df = new Map<string, number>();
  for (const terms of tokenised) for (const term of new Set(terms)) df.set(term, (df.get(term) ?? 0) + 1);

  const K1 = 1.4;
  const B = 0.7;
  const N = docs.length;

  return docs
    .map((doc, i) => {
      const terms = tokenised[i];
      const tf = new Map<string, number>();
      for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
      let score = 0;
      let matchedWeight = 0;
      let totalWeight = 0;
      for (const q of qTerms) {
        const n = df.get(q) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        totalWeight += idf;
        const f = tf.get(q) ?? 0;
        if (!f) continue;
        matchedWeight += idf;
        score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * terms.length) / avgLen)));
      }
      // `coverage` is the IDF-weighted share of query terms found in the doc, so
      // a rare word missing from the whole corpus ("veneers") dominates. The demo
      // responder uses it to decide whether it can answer at all.
      return { doc, score, coverage: totalWeight ? matchedWeight / totalWeight : 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

type LexicalChunk = { id: string; sourceId: string; content: string; title: string; url: string | null };

/** BM25 over chunks, scored 0–1 by blending relative rank with query coverage. */
export function searchLexical(chunks: LexicalChunk[], query: string, k = 5) {
  const hits = bm25Search(
    chunks.map((c) => ({ ...c, text: `${c.title}\n${c.content}` })),
    query,
    k,
  );
  const top = hits[0]?.score ?? 1;
  return hits.map(({ doc, score, coverage }) => ({
    id: doc.id,
    sourceId: doc.sourceId,
    content: doc.content,
    title: doc.title,
    url: doc.url,
    score: Math.min(1, 0.55 * (score / top) * coverage + 0.45 * coverage),
  }));
}
