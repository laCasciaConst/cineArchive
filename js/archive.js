function buildMarquee() {
  let items = favorites
    .map((f, i) => {
      let r = favoriteRecord(f),
        poster = f.poster || r?.poster || "",
        releaseYear = (String(f.title).match(/\b(19|20)\d{2}\b/) || [])[0],
        year = f.year || releaseYear || r?.year || "—",
        rating = f.rating ?? r?.rating;
      return `<div class="fav" data-fav="${i}"><div class="poster">${posterHTML({ ...f, poster })}</div><div class="ft">${esc(f.title)}</div><div class="fr">${esc(year)} · ${rating == null ? "—" : `<span class="star">★</span> ${ratingText(rating)}`}</div></div>`;
    })
    .join("");
  $("track").innerHTML = items + items;
}
function populateYears() {
  let ys = [...new Set(records.map((x) => x.year).filter(Boolean))].sort(
    (a, b) => b - a,
  );
  $("year").innerHTML =
    '<option value="ALL">ALL YEARS</option>' +
    ys.map((y) => `<option>${y}</option>`).join("") +
    '<option value="UNKNOWN">UNKNOWN</option>';
}
function cardMarkup(x) {
  const title = String(x.title || "");
  const releaseYear = x.releaseYear || "";
  return `<article class="card"><div class="poster">${posterHTML(x)}</div><div class="meta"><div class="title" title="${esc(title)}">${esc(title)}</div><div class="detail">${x.rating == null ? "" : `<span class="rating"><b>★</b> ${ratingText(x.rating)}</span>`}<span class="release-year">${releaseYear ? esc(releaseYear) : ""}</span></div>${x.watchedAt ? `<div class="watched-date">${esc(x.watchedAt)}</div>` : ""}</div></article>`;
}
function bindCards() {}
const previewDefaults = {};
function getPreviewCount(year) {
  let saved = JSON.parse(
    localStorage.getItem("cineArchivePreviewCounts") || "{}",
  );
  return Math.max(3, Math.min(6, Number(saved[year] || 4)));
}
function setPreviewCount(year, count) {
  let saved = JSON.parse(
    localStorage.getItem("cineArchivePreviewCounts") || "{}",
  );
  saved[year] = Math.max(3, Math.min(6, Number(count) || 4));
  localStorage.setItem("cineArchivePreviewCounts", JSON.stringify(saved));
}
function yearPageUrl(year) {
  const u = new URL(location.href);
  u.searchParams.set("year", year);
  u.searchParams.set("type", activeType);
  u.searchParams.set("sort", $("sort").value);
  u.searchParams.set("view", view);
  const q = $("search").value.trim();
  if (q) u.searchParams.set("q", q);
  else u.searchParams.delete("q");
  return u.href;
}
function renderYearGroup(year, items) {
  let limit = getPreviewCount(year),
    shown = items.slice(0, limit),
    hasMore = items.length > limit;
  let cards = (list) =>
    view === "grid"
      ? `<div class="grid">${list.map(cardMarkup).join("")}</div>`
      : `<div class="list">${list.map(cardMarkup).join("")}</div>`;
  return `<section class="year-group" data-year-group="${esc(year)}"><div class="year-heading"><button class="year-toggle" data-year-toggle="${esc(year)}" aria-expanded="false"><span class="year-label">${year === "UNKNOWN" ? "Unknown" : esc(year)}</span><span class="year-meta"><span>${items.length} ENTRIES</span><span class="year-symbol">+</span></span></button></div><div class="year-content" hidden><div class="year-preview">${cards(shown)}</div>${hasMore ? `<div class="year-more-wrap"><button class="year-more" data-open-year="${esc(year)}">OPEN YEAR IN NEW WINDOW · ${items.length} ENTRIES ↗</button></div>` : ""}</div></section>`;
}
function render() {
  let arr =
    mode === "watchlist"
      ? watchlist.map((x, i) => ({
          ...x,
          id: "w" + i,
          year: "",
          rating: null,
          type: x.type,
          poster: x.poster || "",
        }))
      : records.slice();
  if (mode === "diary") arr = arr.filter((x) => x.watchedAt);
  if (mode === "archive" && activeType !== "ALL")
    arr = arr.filter((x) => x.type === activeType);
  let q = $("search").value.toLowerCase().trim();
  if (q) arr = arr.filter((x) => x.title.toLowerCase().includes(q));
  let y = yearPage || $("year").value;
  if (y && y !== "ALL")
    arr = arr.filter((x) => String(x.year || "UNKNOWN") === y);
  let sort = $("sort").value;
  arr.sort((a, b) =>
    sort === "rating"
      ? (b.rating ?? -1) - (a.rating ?? -1)
      : sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "year"
          ? (b.year || 0) - (a.year || 0)
          : (b.watchedAt || "").localeCompare(a.watchedAt || ""),
  );
  $("count").textContent = arr.length.toLocaleString() + " RECORDS";
  let catalog = $("catalog");
  if (yearPage) {
    document.body.classList.add("year-page");
    $("kicker").textContent = "COMPLETE YEAR COLLECTION";
    $("heading").textContent = yearPage === "UNKNOWN" ? "Unknown" : yearPage;
    catalog.className = view === "grid" ? "grid" : "list";
    const columnsForViewport = () =>
      window.innerWidth <= 430
        ? 3
        : window.innerWidth <= 1024
          ? 4
          : window.innerWidth < 1280
            ? 4
            : window.innerWidth < 1400
              ? 5
              : 6;
    const pageSize = columnsForViewport() * 5;
    const loaded = Number(yearPageParams.get("loaded") || pageSize);
    const visible = arr.slice(0, Math.max(pageSize, loaded));
    catalog.innerHTML = visible.length
      ? visible.map(cardMarkup).join("")
      : '<div class="emptymsg">No matching records.</div>';
    if (arr.length > visible.length) {
      catalog.insertAdjacentHTML(
        "afterend",
        `<div class="load-more-wrap"><button id="loadMoreYear" class="year-more">더 로딩하기 · ${visible.length}/${arr.length}</button></div>`,
      );
      const more = document.getElementById("loadMoreYear");
      let shown = visible.length;
      more.onclick = () => {
        const batch = columnsForViewport() * 5;
        const next = arr.slice(shown, shown + batch);
        catalog.insertAdjacentHTML("beforeend", next.map(cardMarkup).join(""));
        shown += next.length;
        if (shown >= arr.length) {
          more.parentElement.remove();
        } else {
          more.textContent = `더 로딩하기 · ${shown}/${arr.length}`;
        }
      };
    }
    const back = document.getElementById("yearPageBack");
    if (back)
      back.onclick = () => {
        const u = new URL(location.href);
        u.searchParams.delete("year");
        u.searchParams.delete("type");
        u.searchParams.delete("sort");
        u.searchParams.delete("view");
        u.searchParams.delete("q");
        location.href = u.href;
      };
  } else if (mode === "archive") {
    let groups = {};
    arr.forEach((x) => {
      let k = x.year ? String(x.year) : "UNKNOWN";
      (groups[k] ??= []).push(x);
    });
    let years = Object.keys(groups)
      .filter((x) => x !== "UNKNOWN")
      .sort((a, b) => Number(b) - Number(a));
    if (!Object.prototype.hasOwnProperty.call(groups, "UNKNOWN"))
      groups.UNKNOWN = [];
    years.push("UNKNOWN");
    catalog.className = "archive-groups";
    catalog.innerHTML = years
      .map((yr) => renderYearGroup(yr, groups[yr]))
      .join("");
    document.querySelectorAll("[data-year-toggle]").forEach(
      (btn) =>
        (btn.onclick = () => {
          const target = btn.closest(".year-group");
          const panel = target.querySelector(".year-content");
          const wasOpen = target.classList.contains("is-open");
          document.querySelectorAll(".year-group").forEach((group) => {
            const p = group.querySelector(".year-content");
            group.classList.remove("is-open");
            group
              .querySelector("[data-year-toggle]")
              .setAttribute("aria-expanded", "false");
            group.querySelector(".year-symbol").textContent = "+";
            p.style.maxHeight = p.scrollHeight + "px";
            requestAnimationFrame(() => {
              p.style.maxHeight = "0px";
            });
          });
          if (!wasOpen) {
            target.classList.add("is-open");
            btn.setAttribute("aria-expanded", "true");
            btn.querySelector(".year-symbol").textContent = "−";
            panel.hidden = false;
            panel.style.maxHeight = "0px";
            requestAnimationFrame(() => {
              panel.style.maxHeight = panel.scrollHeight + "px";
            });
          }
        }),
    );
    document
      .querySelectorAll("[data-open-year]")
      .forEach(
        (btn) =>
          (btn.onclick = () =>
            window.open(
              yearPageUrl(btn.dataset.openYear),
              "_blank",
              "noopener",
            )),
      );
  } else {
    catalog.className = view === "grid" ? "grid" : "list";
    catalog.innerHTML = arr.length
      ? arr.map(cardMarkup).join("")
      : '<div class="emptymsg">No matching records.</div>';
  }
  bindCards();
}
