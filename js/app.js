(function () {
  "use strict";

  const PER_PAGE = 25;
  const DATA_URL = "data/mapping-specifications.json";

  let allSpecs = [];
  let filteredSpecs = [];
  let lunrIndex = null;
  let currentPage = 1;

  // Active facet filters: key = facet id, value = Set of selected values
  const activeFilters = {
    type: new Set(),
    sourceType: new Set(),
    license: new Set(),
    subjectSource: new Set(),
    objectSource: new Set(),
    creator: new Set(),
  };

  let searchQuery = "";
  let debounceTimer = null;

  // --- Helpers ---

  // Map CC license URL to { label, icon } where icon is the CC button SVG filename
  const CC_ICONS = {
    "by": "by",
    "by-sa": "by-sa",
    "by-nd": "by-nd",
    "by-nc": "by-nc",
    "by-nc-sa": "by-nc-sa",
    "by-nc-nd": "by-nc-nd",
    "zero": "zero",
  };

  function parseLicense(url) {
    if (!url) return null;
    // CC licenses: /licenses/<type>/<version>/ or /publicdomain/zero/<version>/
    var m = url.match(/creativecommons\.org\/licenses\/([^/]+)\/([^/]+)/);
    if (m) {
      var slug = m[1].toLowerCase();
      var ver = m[2];
      var icon = CC_ICONS[slug];
      return {
        label: "CC " + slug.toUpperCase() + " " + ver,
        url: url,
        iconUrl: icon ? "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/" + icon + ".svg" : null,
      };
    }
    m = url.match(/creativecommons\.org\/publicdomain\/zero\/([^/]+)/);
    if (m) {
      return {
        label: "CC0 " + m[1],
        url: url,
        iconUrl: "https://mirrors.creativecommons.org/presskit/buttons/80x15/svg/cc-zero.svg",
      };
    }
    if (url.includes("unspecified")) return { label: "Unspecified", url: null, iconUrl: null };
    var fallback = url.split("/").filter(Boolean).pop() || url;
    return { label: fallback, url: url, iconUrl: null };
  }

  function shortenLicense(url) {
    var parsed = parseLicense(url);
    return parsed ? parsed.label : null;
  }

  function truncate(str, len) {
    if (!str) return "";
    return str.length > len ? str.slice(0, len) + "..." : str;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Data Loading ---

  async function loadData() {
    document.getElementById("results-list").innerHTML =
      '<div class="loading">Loading mapping specifications...</div>';

    const resp = await fetch(DATA_URL);
    if (!resp.ok) throw new Error("Failed to load data: " + resp.status);
    allSpecs = await resp.json();

    // Build Lunr index
    lunrIndex = lunr(function () {
      this.ref("_idx");
      this.field("name", { boost: 10 });
      this.field("description", { boost: 5 });
      this.field("mapping_method", { boost: 3 });
      this.field("subject_source_name", { boost: 7 });
      this.field("object_source_name", { boost: 7 });
      this.field("license_short");
      this.field("id");
      this.field("creator_name", { boost: 4 });

      allSpecs.forEach((spec, i) => {
        this.add({
          _idx: i,
          name: spec.name || "",
          description: spec.description || "",
          mapping_method: spec.mapping_method || "",
          subject_source_name: spec.subject_source ? spec.subject_source.name : "",
          object_source_name: spec.object_source ? spec.object_source.name : "",
          license_short: shortenLicense(spec.license) || "",
          id: spec.id || "",
          creator_name: spec.creator ? spec.creator.name : "",
        });
      });
    });

    applyFilters();
    buildFacets();
  }

  // --- Facets ---

  function getFacetValue(spec, facetKey) {
    switch (facetKey) {
      case "type":
        return spec.type ? [spec.type] : [];
      case "sourceType": {
        const types = new Set();
        if (spec.subject_source && spec.subject_source.type)
          types.add(spec.subject_source.type);
        if (spec.object_source && spec.object_source.type)
          types.add(spec.object_source.type);
        return Array.from(types);
      }
      case "license":
        return spec.license ? [shortenLicense(spec.license)] : [];
      case "subjectSource":
        return spec.subject_source && spec.subject_source.name
          ? [spec.subject_source.name]
          : [];
      case "objectSource":
        return spec.object_source && spec.object_source.name
          ? [spec.object_source.name]
          : [];
      case "creator":
        return spec.creator && spec.creator.name ? [spec.creator.name] : [];
      default:
        return [];
    }
  }

  function countFacetValues(specs, facetKey) {
    const counts = {};
    specs.forEach((spec) => {
      getFacetValue(spec, facetKey).forEach((val) => {
        counts[val] = (counts[val] || 0) + 1;
      });
    });
    return counts;
  }

  function buildFacets() {
    const facetConfigs = [
      { key: "type", elementId: "facet-type" },
      { key: "sourceType", elementId: "facet-source-type" },
      { key: "license", elementId: "facet-license" },
      { key: "subjectSource", elementId: "facet-subject-source" },
      { key: "objectSource", elementId: "facet-object-source" },
      { key: "creator", elementId: "facet-creator" },
    ];

    // Count against specs that match search + all OTHER facets (cross-facet counts)
    facetConfigs.forEach(({ key, elementId }) => {
      const container = document.getElementById(elementId);
      const heading = container.querySelector("h3");

      // Get specs filtered by search + all facets except this one
      const otherFiltered = getFilteredSpecs(key);
      const counts = countFacetValues(otherFiltered, key);

      // Sort by count descending
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

      // Clear previous options
      container.innerHTML = "";
      container.appendChild(heading);

      if (entries.length === 0) {
        container.style.display = "none";
        return;
      }
      container.style.display = "";

      entries.forEach(([val, count]) => {
        const label = document.createElement("label");
        label.className = "facet-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = activeFilters[key].has(val);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            activeFilters[key].add(val);
          } else {
            activeFilters[key].delete(val);
          }
          currentPage = 1;
          applyFilters();
          buildFacets();
        });

        const text = document.createTextNode(" " + val + " ");
        const countSpan = document.createElement("span");
        countSpan.className = "facet-count";
        countSpan.textContent = count;

        label.appendChild(checkbox);
        label.appendChild(text);
        label.appendChild(countSpan);
        container.appendChild(label);
      });
    });
  }

  // Get specs filtered by search + all facets except excludeFacetKey
  function getFilteredSpecs(excludeFacetKey) {
    let specs = allSpecs;

    // Apply search
    if (searchQuery.trim()) {
      try {
        const results = lunrIndex.search(searchQuery + "~1");
        const idxSet = new Set(results.map((r) => parseInt(r.ref)));
        specs = specs.filter((_, i) => idxSet.has(i));
      } catch (e) {
        // If lunr query parsing fails, try as plain term
        try {
          const results = lunrIndex.search(searchQuery);
          const idxSet = new Set(results.map((r) => parseInt(r.ref)));
          specs = specs.filter((_, i) => idxSet.has(i));
        } catch (e2) {
          // Give up on search, show all
        }
      }
    }

    // Apply each facet except the excluded one
    Object.keys(activeFilters).forEach((key) => {
      if (key === excludeFacetKey) return;
      if (activeFilters[key].size === 0) return;
      specs = specs.filter((spec) => {
        const vals = getFacetValue(spec, key);
        return vals.some((v) => activeFilters[key].has(v));
      });
    });

    return specs;
  }

  // --- Filtering ---

  function applyFilters() {
    filteredSpecs = getFilteredSpecs(null);
    renderResults();
    renderPagination();
    renderSummary();
  }

  // --- Rendering ---

  function renderSummary() {
    const summary = document.getElementById("results-summary");
    const total = allSpecs.length;
    const shown = filteredSpecs.length;
    if (shown === total) {
      summary.textContent = total + " mapping specifications";
    } else {
      summary.textContent =
        "Showing " + shown + " of " + total + " mapping specifications";
    }
  }

  function renderResults() {
    const container = document.getElementById("results-list");
    const start = (currentPage - 1) * PER_PAGE;
    const pageSpecs = filteredSpecs.slice(start, start + PER_PAGE);

    if (pageSpecs.length === 0) {
      container.innerHTML =
        '<div class="loading">No mapping specifications match your search.</div>';
      return;
    }

    container.innerHTML = pageSpecs.map((spec) => renderCard(spec)).join("");
  }

  function renderAgent(agent) {
    if (!agent) return null;
    var parts = [];
    if (agent.name) parts.push(escapeHtml(agent.name));
    if (agent.orcid) parts.push('<span class="detail-secondary">' + escapeHtml(agent.orcid) + '</span>');
    if (agent.affiliation) parts.push('<span class="detail-secondary">' + escapeHtml(agent.affiliation) + '</span>');
    if (agent.ror_id) parts.push('<span class="detail-secondary">' + escapeHtml(agent.ror_id) + '</span>');
    if (agent.url) parts.push(renderUrl(agent.url));
    if (agent.version) parts.push('<span class="detail-secondary">v' + escapeHtml(agent.version) + '</span>');
    if (agent.repository_url) parts.push(renderUrl(agent.repository_url));
    if (parts.length === 0 && agent.id) parts.push(escapeHtml(agent.id));
    return parts.length ? parts.join(" ") : null;
  }

  function renderSource(source) {
    if (!source) return null;
    var parts = [];
    var label = source.name || source.id || null;
    if (label) parts.push('<strong>' + escapeHtml(label) + '</strong>');
    if (source.version) parts.push('v' + escapeHtml(source.version));
    if (source.type) parts.push('<span class="badge badge-type badge-sm">' + escapeHtml(source.type) + '</span>');
    if (source.content_url) parts.push(renderUrl(source.content_url));
    if (source.documentation) parts.push(renderUrl(source.documentation, "docs"));
    if (source.content_type) parts.push('<span class="detail-secondary">' + escapeHtml(source.content_type) + '</span>');
    if (source.metadata_url) parts.push(renderUrl(source.metadata_url, "metadata"));
    return parts.length ? parts.join(" ") : null;
  }

  function renderUrl(url, label) {
    if (!url) return "";
    var display = label || url;
    return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" class="detail-link">' +
      escapeHtml(display) + '</a>';
  }

  function renderFairScore(score) {
    if (score == null) return "";
    var pct = Math.round(score * 100);
    var color = pct >= 70 ? "#059669" : pct >= 40 ? "#d97706" : "#dc2626";
    return '<span class="fair-score" title="FAIR completeness score: ' + pct + '%"' +
      ' style="--score-color: ' + color + '">' +
      '<svg class="fair-ring" viewBox="0 0 36 36">' +
      '<circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" stroke-width="3"/>' +
      '<circle cx="18" cy="18" r="15.9" fill="none" stroke="' + color + '" stroke-width="3"' +
      ' stroke-dasharray="' + pct + ' ' + (100 - pct) + '"' +
      ' stroke-dashoffset="25" stroke-linecap="round"/>' +
      '</svg>' +
      '<span class="fair-pct">' + pct + '%</span>' +
      '</span>';
  }

  function renderLicenseBadge(spec) {
    var licenseInfo = parseLicense(spec.license);
    if (!licenseInfo) return "";
    if (licenseInfo.iconUrl) {
      var img = '<img src="' + escapeHtml(licenseInfo.iconUrl) +
        '" alt="' + escapeHtml(licenseInfo.label) +
        '" class="cc-icon" title="' + escapeHtml(licenseInfo.label) + '">';
      return licenseInfo.url
        ? '<a href="' + escapeHtml(licenseInfo.url) + '" target="_blank" rel="noopener" class="cc-link">' + img + '</a>'
        : img;
    }
    return '<span class="badge badge-license">' + escapeHtml(licenseInfo.label) + '</span>';
  }

  function renderCard(spec) {
    var title = escapeHtml(spec.name || spec.id || "Untitled");
    var typeBadge = spec.type
      ? '<span class="badge badge-type">' + escapeHtml(spec.type) + "</span>"
      : "";


    // Sources line
    var subjLabel = spec.subject_source
      ? (spec.subject_source.name || spec.subject_source.id || "")
      : "";
    var objLabel = spec.object_source
      ? (spec.object_source.name || spec.object_source.id || "")
      : "";
    var sourcesHtml = "";
    if (subjLabel || objLabel) {
      sourcesHtml = '<div class="result-card-sources">' +
        '<span class="source-name">' + escapeHtml(subjLabel) + '</span>' +
        (subjLabel && objLabel ? ' <span class="arrow">&rarr;</span> ' : '') +
        '<span class="source-name">' + escapeHtml(objLabel) + '</span>' +
        '</div>';
    }

    // Detail rows — all fields from the schema
    var details = [];

    function addDetail(label, html) {
      if (html) details.push('<dt>' + label + '</dt><dd>' + html + '</dd>');
    }

    addDetail("ID", spec.id ? renderUrl(spec.id) : null);
    addDetail("Version", spec.version ? escapeHtml(spec.version) : null);
    addDetail("Type", spec.type ? escapeHtml(spec.type) : null);
    addDetail("License", spec.license ? renderLicenseBadge(spec) : null);
    addDetail("Publication date", spec.publication_date ? escapeHtml(spec.publication_date) : null);
    addDetail("Mapping method", spec.mapping_method ? escapeHtml(spec.mapping_method) : null);
    addDetail("Subject source", renderSource(spec.subject_source));
    addDetail("Object source", renderSource(spec.object_source));
    addDetail("Creator", renderAgent(spec.creator));
    addDetail("Author", renderAgent(spec.author));
    addDetail("Reviewer", renderAgent(spec.reviewer));
    addDetail("Content", spec.content_url ? renderUrl(spec.content_url) : null);
    addDetail("Documentation", spec.documentation ? renderUrl(spec.documentation) : null);
    addDetail("Description", spec.description ? escapeHtml(spec.description) : null);
    if (spec.registries && spec.registries.length) {
      var regHtml = spec.registries.map(function(r) {
        var label = escapeHtml(r.name || r.id || "Unknown");
        return r.url ? '<a href="' + escapeHtml(r.url) + '" target="_blank" rel="noopener" class="detail-link">' + label + '</a>' : label;
      }).join(", ");
      addDetail("Registries", regHtml);
    }

    var detailsHtml = details.length
      ? '<div class="result-card-details">' +
        '<dl class="detail-grid">' + details.join("") + '</dl></div>'
      : "";

    return (
      '<div class="result-card">' +
      '<div class="result-card-header">' +
      '<span class="result-card-title">' + title + '</span>' +
      typeBadge +
      renderFairScore(spec.fair_score) +
      '</div>' +
      sourcesHtml +
      detailsHtml +
      '</div>'
    );
  }

  function renderPagination() {
    const container = document.getElementById("pagination");
    const totalPages = Math.ceil(filteredSpecs.length / PER_PAGE);

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = "";

    // Previous
    html +=
      '<button class="page-btn" data-page="' +
      (currentPage - 1) +
      '"' +
      (currentPage === 1 ? " disabled" : "") +
      ">&laquo; Prev</button>";

    // Page numbers (show max 7 around current)
    const startPage = Math.max(1, currentPage - 3);
    const endPage = Math.min(totalPages, currentPage + 3);

    if (startPage > 1) {
      html += '<button class="page-btn" data-page="1">1</button>';
      if (startPage > 2) html += '<span style="padding: 0 0.3rem">...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
      html +=
        '<button class="page-btn' +
        (i === currentPage ? " active" : "") +
        '" data-page="' +
        i +
        '">' +
        i +
        "</button>";
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1)
        html += '<span style="padding: 0 0.3rem">...</span>';
      html +=
        '<button class="page-btn" data-page="' +
        totalPages +
        '">' +
        totalPages +
        "</button>";
    }

    // Next
    html +=
      '<button class="page-btn" data-page="' +
      (currentPage + 1) +
      '"' +
      (currentPage === totalPages ? " disabled" : "") +
      ">Next &raquo;</button>";

    container.innerHTML = html;

    container.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        currentPage = parseInt(btn.dataset.page);
        renderResults();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  // --- Search / Autocomplete ---

  function setupSearch() {
    const input = document.getElementById("search-input");
    const dropdown = document.getElementById("autocomplete-dropdown");
    let highlightedIndex = -1;

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = input.value;
        currentPage = 1;
        applyFilters();
        buildFacets();
        showAutocomplete(input.value, dropdown);
      }, 200);
    });

    input.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
        updateHighlight(items, highlightedIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        updateHighlight(items, highlightedIndex);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && items[highlightedIndex]) {
          input.value = items[highlightedIndex].dataset.name;
          searchQuery = input.value;
          currentPage = 1;
          applyFilters();
          buildFacets();
          dropdown.classList.remove("active");
          highlightedIndex = -1;
        }
      } else if (e.key === "Escape") {
        dropdown.classList.remove("active");
        highlightedIndex = -1;
      }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-bar")) {
        dropdown.classList.remove("active");
        highlightedIndex = -1;
      }
    });
  }

  function updateHighlight(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle("highlighted", i === index);
    });
  }

  function showAutocomplete(query, dropdown) {
    if (!query.trim() || !lunrIndex) {
      dropdown.classList.remove("active");
      return;
    }

    let results;
    try {
      results = lunrIndex.search(query + "*");
    } catch (e) {
      try {
        results = lunrIndex.search(query);
      } catch (e2) {
        dropdown.classList.remove("active");
        return;
      }
    }

    const top = results.slice(0, 8);
    if (top.length === 0) {
      dropdown.classList.remove("active");
      return;
    }

    dropdown.innerHTML = top
      .map((r) => {
        const spec = allSpecs[parseInt(r.ref)];
        const name = spec.name || spec.id || "Untitled";
        // Show which field matched
        const matchedFields = Object.keys(r.matchData.metadata)
          .flatMap((term) => Object.keys(r.matchData.metadata[term]))
          .filter((v, i, a) => a.indexOf(v) === i);
        const fieldLabel = matchedFields
          .map((f) => f.replace(/_/g, " "))
          .join(", ");
        return (
          '<div class="autocomplete-item" data-name="' +
          escapeHtml(name) +
          '">' +
          "<div>" +
          escapeHtml(truncate(name, 80)) +
          "</div>" +
          '<div class="match-field">Matched: ' +
          escapeHtml(fieldLabel) +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    dropdown.classList.add("active");

    dropdown.querySelectorAll(".autocomplete-item").forEach((item) => {
      item.addEventListener("click", () => {
        const input = document.getElementById("search-input");
        input.value = item.dataset.name;
        searchQuery = input.value;
        currentPage = 1;
        applyFilters();
        buildFacets();
        dropdown.classList.remove("active");
      });
    });
  }

  // --- Init ---

  function init() {
    setupSearch();
    loadData().catch((err) => {
      console.error(err);
      document.getElementById("results-list").innerHTML =
        '<div class="loading">Error loading data. Please try again later.</div>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
