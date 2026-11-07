let records = initial.records,
  watchlist = initial.watchlist,
  favorites = initial.favorites.map((title) => ({
    title,
    poster: "",
    rating: null,
  }));
let current = null,
  activeType = "ALL",
  mode = "archive",
  view = "grid";
const yearPageParams = new URLSearchParams(location.search);
const yearPage = yearPageParams.get("year");
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function toast(t) {
  $("toast").textContent = t;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}
function ratingText(r) {
  return r == null ? "—" : Number(r).toFixed(1);
}
function posterFallback(title) {
  return `<div class="empty">${esc(title)}</div>`;
}
function posterHTML(item) {
  return item.poster
    ? `<img loading="lazy" src="${esc(item.poster)}" onerror="this.style.display='none';this.parentNode.innerHTML='${posterFallback(item.title).replace(/'/g, "&#39;")}'">`
    : posterFallback(item.title);
}
function normTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
}
function favoriteRecord(f) {
  let n = normTitle(f.title);
  let aliases = {
    steinsgate: "슈타인즈게이트",
    "legendof thegalacticheroes": "은하영웅전설",
    thirst: "갈증",
    kasane: "카사네",
    fleabagseason2: "플리백시즌2",
    inthemoodforlove: "화양연화",
    oldboy: "올드보이",
    babylon: "바빌론",
    heat: "히트",
    sicario: "시카리오",
    americanbeauty: "아메리칸뷰티",
    "eternalsunshineofthe spotlessmind": "이터널선샤인",
    constantine: "콘스탄틴",
    infernalaffairs: "무간도",
    breakingbadseason1: "브레이킹배드시즌1",
    marriagestory: "결혼이야기",
    lustcaution: "색계",
    decisiontoleave: "헤어질결심",
    catonahottinroof: "뜨거운양철지붕위의고양이",
    deathbecomesher: "죽어야사는여자",
    queenmargot: "여왕마고",
    "pleins oleil": "태양은가득히",
    chernobyl: "체르노빌",
    aperfectday: "어퍼펙트데이",
    macbeth: "맥베스",
    russiandoll: "러시아인형처럼",
    batmanreturns: "배트맨2",
    elemental: "엘리멘탈",
    thelakehouse: "레이크하우스",
    perfectblue: "퍼펙트블루",
    memories: "메모리즈",
    cowboybebop: "카우보이비밥",
  };
  let target = aliases[n] || n;
  return (
    records.find((r) => normTitle(r.title) === target) ||
    records.find(
      (r) =>
        normTitle(r.title).includes(target) ||
        target.includes(normTitle(r.title)),
    )
  );
}
