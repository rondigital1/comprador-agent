const normalizedUrl = (value: string) => {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
};

export function collectWebSources(output: unknown[]) {
  const sources = new Map<string, { title: string; url: string }>();
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "web_search_call") {
      const action = record.action as Record<string, unknown> | undefined;
      const actionSources = Array.isArray(action?.sources)
        ? action.sources
        : [];
      for (const entry of actionSources) {
        const url =
          entry && typeof entry === "object"
            ? (entry as Record<string, unknown>).url
            : null;
        if (typeof url === "string") {
          const key = normalizedUrl(url);
          if (key) sources.set(key, { title: new URL(key).hostname, url });
        }
      }
    }
    if (record.type !== "message" || !Array.isArray(record.content)) continue;
    for (const content of record.content) {
      if (!content || typeof content !== "object") continue;
      const annotations = (content as Record<string, unknown>).annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const citation = annotation as Record<string, unknown>;
        if (
          citation.type !== "url_citation" ||
          typeof citation.url !== "string"
        ) {
          continue;
        }
        const key = normalizedUrl(citation.url);
        if (key) {
          sources.set(key, {
            title:
              typeof citation.title === "string"
                ? citation.title
                : new URL(key).hostname,
            url: citation.url,
          });
        }
      }
    }
  }
  return [...sources.values()];
}

export function isGroundedUrl(
  value: string,
  webSources: Array<{ url: string }>,
) {
  const normalized = normalizedUrl(value);
  return Boolean(
    normalized &&
    webSources.some(({ url }) => normalizedUrl(url) === normalized),
  );
}
