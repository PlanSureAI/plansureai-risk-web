export async function generateEmbeddings(text: string): Promise<number[]> {
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
  ]);

  words.forEach((word) => {
    const cleaned = word.replace(/[^a-z0-9]/g, "");
    if (cleaned.length > 3 && !stopWords.has(cleaned)) {
      wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
    }
  });

  const embedding = new Array(384).fill(0);
  let index = 0;

  Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 384)
    .forEach(([, freq]) => {
      embedding[index] = Math.min(freq / 10, 1);
      index += 1;
    });

  return embedding;
}

export function calculateEmbeddingSimilarity(
  embedding1: number[],
  embedding2: number[]
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same dimension");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i += 1) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  const cosineSimilarity =
    dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  return cosineSimilarity;
}
