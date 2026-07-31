const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const BASE_URL = "https://www.heyuehuan.com";
const PUB_GLOB = "src/publication/*.md";
const POST_GLOB = "src/post/*.md";

// ISO strings like "2023-05-08T00:00:00+00:00"; compared/formatted lexically to
// avoid timezone drift.
const ymd = (iso) => iso.slice(0, 10).split("-").map(Number);
const monthYear = (iso) => { const [y, m] = ymd(iso); return `${MONTHS[m - 1]}, ${y}`; };
const mdy = (iso) => { const [y, m, d] = ymd(iso); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const byDateDesc = (a, b) => (a.data.pdate < b.data.pdate ? 1 : -1);

// Hugo-style querified text: URL-encode, then render "+" (space) as &#43;
const qplus = (s) => encodeURIComponent(s).replace(/%20/g, "&#43;");

function shareBox(titlePlain, pageUrl) {
  const u = encodeURIComponent(BASE_URL + pageUrl);
  const t = qplus(titlePlain);
  const te = encodeURIComponent(titlePlain);
  const li = (href, cls, icon, ficon = "fab") => `      <li>
        <a href="${href}" target="_blank" rel="noopener" class="share-btn-${cls}" aria-label="${icon === "envelope" ? "envelope" : icon}">
          <i class="${ficon} fa-${icon}"></i>
        </a>
      </li>`;
  return `<div class="share-box">
  <ul class="share">
${li(`https://twitter.com/intent/tweet?url=${u}&amp;text=${t}`, "twitter", "twitter")}
${li(`https://www.facebook.com/sharer.php?u=${u}&amp;t=${t}`, "facebook", "facebook")}
${li(`mailto:?subject=${te}&amp;body=${u}`, "email", "envelope", "fas")}
${li(`https://www.linkedin.com/shareArticle?url=${u}&amp;title=${t}`, "linkedin", "linkedin-in")}
${li(`whatsapp://send?text=${t}%20${u}`, "whatsapp", "whatsapp")}
${li(`https://service.weibo.com/share/share.php?url=${u}&amp;title=${t}`, "weibo", "weibo")}
  </ul>
</div>`;
}

module.exports = function (cfg) {
  cfg.setNunjucksEnvironmentOptions({ autoescape: false });

  cfg.addFilter("monthYear", monthYear);
  cfg.addFilter("mdy", mdy);
  cfg.addFilter("mdyShort", (iso) => { const [y, m, d] = ymd(iso); return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`; });
  cfg.addFilter("yearOf", (iso) => iso.slice(0, 4));
  cfg.addFilter("attrT", (iso) => iso.replace("+", "&#43;"));
  cfg.addFilter("isoZ", (iso) => iso.replace("+00:00", "Z"));
  cfg.addFilter("authorSpans", (authors) => authors
    .map((a) => `<span ${a.highlight ? 'class="author-highlighted"' : ""}>\n      ${a.name}</span>`)
    .join(", "));
  // Hugo renders theme links and custom (url_custom) links with different whitespace.
  const btn = (sm) => (links) => links
    .map((l) => {
      const cls = `btn btn-outline-primary btn-page-header${sm ? " btn-sm" : ""}`;
      return l.custom
        ? `  <a class="${cls}" href="${l.url}" target="_blank" rel="noopener">\n    ${l.label}</a>`
        : `<a class="${cls}" href="${l.url}" target="_blank" rel="noopener">\n  ${l.label}\n</a>`;
    })
    .join("\n");
  cfg.addFilter("btnLinks", btn(false));
  cfg.addFilter("btnLinksSm", btn(true));
  cfg.addShortcode("shareBox", shareBox);

  cfg.addCollection("pubs", (api) => api.getFilteredByGlob(PUB_GLOB).sort(byDateDesc));
  cfg.addCollection("posts", (api) => api.getFilteredByGlob(POST_GLOB).sort(byDateDesc));
  cfg.addCollection("tagList", (api) => {
    const map = {};
    for (const p of api.getFilteredByGlob(PUB_GLOB)) {
      for (const t of p.data.pubTags || []) {
        const e = (map[t.slug] ??= {
          slug: t.slug, title: t.name, url: `/tag/${t.slug}/`,
          rssPath: `/tag/${t.slug}/index.xml`, updated: "", items: [],
        });
        e.items.push(p);
        if (p.data.pdate > e.updated) e.updated = p.data.pdate;
      }
    }
    const arr = Object.values(map);
    arr.forEach((e) => e.items.sort(byDateDesc));
    arr.sort((a, b) => (a.updated === b.updated
      ? (a.title < b.title ? -1 : 1)
      : (a.updated < b.updated ? 1 : -1)));
    return arr;
  });
  cfg.addCollection("typeList", (api) => {
    const map = {};
    for (const p of api.getFilteredByGlob(PUB_GLOB)) {
      const id = p.data.typeId;
      const e = (map[id] ??= {
        slug: id, title: id, label: p.data.typeLabel, url: `/publication-type/${id}/`,
        rssPath: `/publication-type/${id}/index.xml`, updated: "", items: [],
      });
      e.items.push(p);
      if (p.data.pdate > e.updated) e.updated = p.data.pdate;
    }
    const arr = Object.values(map);
    arr.forEach((e) => e.items.sort(byDateDesc));
    arr.sort((a, b) => (a.slug < b.slug ? -1 : 1));
    return arr;
  });
  cfg.addCollection("pubYears", (api) => {
    const years = new Set(api.getFilteredByGlob(PUB_GLOB).map((p) => p.data.pdate.slice(0, 4)));
    return [...years].sort().reverse();
  });

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
    markdownTemplateEngine: "njk",
  };
};
