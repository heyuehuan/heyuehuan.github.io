module.exports = function (cfg) {
  // Static assets and frozen artifacts copied verbatim from the repo root.
  const passthrough = [
    "css", "js", "media", "uploads", "webfonts", "authors", "admin", "en", "sta260",
    "notes.html", "CNAME", "robots.txt", "_headers", "_redirects", "manifest.webmanifest",
    "index.json", "index.xml", "sitemap.xml",
    "post/index.xml", "post/page",
    "publication/index.xml", "publication_types/index.xml",
    "categories/index.xml", "tags/index.xml",
  ];
  passthrough.push("publication_types/page", "tags/page", "categories/page");
  for (const n of ["1", "2", "7"]) {
    passthrough.push(`publication-type/${n}/index.xml`, `publication-type/${n}/page`);
  }
  for (const t of ["decision", "financial-optimization", "imbalanced-dataset",
    "natural-language-processing", "operation-resaerch", "operation-research",
    "optimization", "portfolio-optimization", "self-training"]) {
    passthrough.push(`tag/${t}/index.xml`, `tag/${t}/page`);
  }
  for (const p of passthrough) cfg.addPassthroughCopy({ [p]: p });

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    htmlTemplateEngine: "njk",
  };
};
