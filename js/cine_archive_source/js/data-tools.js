function setMenu(open) {
  let shell = document.querySelector(".shell");
  shell.classList.toggle("menu-open", open);
  $("menuToggle").setAttribute("aria-expanded", String(open));
  $("menuToggle").setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  $("menuToggle").textContent = open ? "×" : "☰";
  let backdrop = $("navBackdrop");
  if (open && !backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "navBackdrop";
    backdrop.className = "nav-backdrop";
    backdrop.addEventListener("click", () => setMenu(false));
    document.body.appendChild(backdrop);
  } else if (!open && backdrop) backdrop.remove();
}
$("menuToggle").onclick = () =>
  setMenu(!document.querySelector(".shell").classList.contains("menu-open"));
function exportData() {
  let blob = new Blob(
    [JSON.stringify({ records, favorites, watchlist }, null, 2)],
    { type: "application/json" },
  );
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cine-archive-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
}
function importJSON(file) {
  let r = new FileReader();
  r.onload = () => {
    try {
      let d = JSON.parse(r.result);
      records = d.records || records;
      favorites = d.favorites || favorites;
      watchlist = d.watchlist || watchlist;
      persist();
      buildMarquee();
      populateYears();
      render();
      toast("Archive imported");
    } catch (e) {
      toast("Invalid JSON file");
    }
  };
  r.readAsText(file);
}
// Backup/import controls via keyboard shortcuts: Ctrl/Cmd+Shift+E exports; Ctrl/Cmd+Shift+I imports.
function parseCSV(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i],
      n = text[i + 1];
    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i++;
    } else if (c === '"') quoted = !quoted;
    else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\\n" || c === "\\r") && !quoted) {
      if (c === "\\r" && n === "\\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
function sheetCSVUrl(raw) {
  const u = new URL(raw.trim());
  if (!/docs\\.google\\.com$/.test(u.hostname))
    throw new Error("Google Sheets 주소를 입력하세요");
  if (u.pathname.includes("/spreadsheets/d/e/")) {
    u.searchParams.set("output", "csv");
    return u.href;
  }
  const m = u.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!m) throw new Error("스프레드시트 URL 형식이 올바르지 않습니다");
  const gid =
    u.searchParams.get("gid") || (u.hash.match(/gid=(\d+)/) || [])[1] || "0";
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}
function headerKey(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[\s_./()-]/g, "");
}
function importSheetRows(rows) {
  if (rows.length < 2) throw new Error("시트에 가져올 데이터가 없습니다");
  const heads = rows[0].map(headerKey),
    find = (...names) =>
      names.map((n) => heads.indexOf(headerKey(n))).find((i) => i >= 0);
  const ix = {
    id: find("id", "번호"),
    title: find(
      "국가기준원제후보",
      "원제",
      "original title",
      "original_title",
      "title",
      "제목",
      "작품명",
    ),
    year: find("year", "연도", "감상연도", "시청연도"),
    date: find("watchedAt", "감상일", "시청일", "날짜"),
    rating: find("rating", "평점", "별점"),
    type: find("type", "유형", "구분"),
    status: find("status", "상태"),
    flag: find("flag", "표시"),
    poster: find("poster", "포스터", "posterurl", "포스터url"),
    note: find("note", "메모", "감상평"),
    rewatch: find("rewatch", "재감상"),
  };
  if (ix.title == null)
    throw new Error(
      "제목 열을 찾지 못했습니다. 제목 또는 작품명 열이 필요합니다.",
    );
  const incoming = [];
  rows.slice(1).forEach((r, i) => {
    const title = (r[ix.title] || "").trim();
    if (!title) return;
    let typ = (ix.type == null ? "" : r[ix.type] || "").toLowerCase();
    typ = /film|movie|영화|극장/.test(typ)
      ? "F"
      : /series|tv|드라마|시리즈/.test(typ)
        ? "S"
        : /animation|애니/.test(typ)
          ? "A"
          : typ === "f" || typ === "s" || typ === "a" || typ === "n"
            ? typ.toUpperCase()
            : "N";
    let year =
      ix.year == null
        ? null
        : Number(String(r[ix.year] || "").match(/\d{4}/)?.[0]) || null;
    let rating =
      ix.rating == null || !r[ix.rating]?.trim() ? null : Number(r[ix.rating]);
    let date = ix.date == null ? "" : (r[ix.date] || "").trim();
    if (date && !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {
      const d = new Date(date);
      date = isNaN(d) ? "" : d.toISOString().slice(0, 10);
    }
    const releaseYear =
      (title.match(/[（(](19|20)\\d{2}[）)]\\s*$/) || [])[0]?.replace(
        /[^0-9]/g,
        "",
      ) || "";
    const cleanTitle = title
      .replace(/\\s*[（(](19|20)\\d{2}[）)]\\s*$/, "")
      .trim();
    incoming.push({
      id:
        ix.id != null && r[ix.id]?.trim()
          ? r[ix.id].trim()
          : "sheet-" + i + "-" + normTitle(title),
      title: cleanTitle || title,
      releaseYear,
      year,
      rating: Number.isFinite(rating) ? rating : null,
      type: typ,
      status: ix.status == null ? "" : r[ix.status] || "",
      flag: ix.flag == null ? "" : r[ix.flag] || "",
      watchedAt: date || null,
      rewatch:
        ix.rewatch == null
          ? false
          : /true|1|yes|y|재감상/i.test(r[ix.rewatch] || ""),
      poster: ix.poster == null ? "" : (r[ix.poster] || "").trim(),
      note: ix.note == null ? "" : r[ix.note] || "",
    });
  });
  const byKey = new Map(
    records.map((x) => [x.id || normTitle(x.title) + "|" + (x.year || ""), x]),
  );
  const byTitleYear = new Map(
    records.map((x) => [normTitle(x.title) + "|" + (x.year || ""), x]),
  );
  incoming.forEach((item) => {
    const key = item.id,
      ty = normTitle(item.title) + "|" + (item.year || "");
    let old = byKey.get(key) || byTitleYear.get(ty);
    if (old) {
      Object.assign(
        old,
        Object.fromEntries(
          Object.entries(item).filter(
            ([k, v]) => v !== "" && v !== null && v !== undefined,
          ),
        ),
      );
      if (!item.poster) old.poster = old.poster || "";
    } else {
      records.push(item);
      byKey.set(key, item);
      byTitleYear.set(ty, item);
    }
  });
  persist();
  populateYears();
  $("total").textContent = records.length.toLocaleString();
  $("movies").textContent = records
    .filter((x) => x.type === "F")
    .length.toLocaleString();
  $("series").textContent = records
    .filter((x) => x.type === "S" || x.type === "A")
    .length.toLocaleString();
  render();
  toast(`${incoming.length}개 행을 Google Sheets에서 가져왔습니다`);
}
