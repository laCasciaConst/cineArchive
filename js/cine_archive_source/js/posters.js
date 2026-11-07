function readPosterCache() {
  try {
    return JSON.parse(localStorage.getItem("cineArchivePosterCache") || "{}");
  } catch (e) {
    return {};
  }
}
function writePosterCache(cache) {
  try {
    localStorage.setItem("cineArchivePosterCache", JSON.stringify(cache));
  } catch (e) {
    toast("포스터 캐시 저장 공간이 부족합니다");
  }
}
async function fetchPoster(title, key) {
  const cache = readPosterCache(),
    cacheKey = normTitle(title);
  if (cache[cacheKey] && cache[cacheKey].url) return cache[cacheKey].url;
  if (cache[cacheKey] && cache[cacheKey].missing) return "";
  let url =
    "https://api.themoviedb.org/3/search/multi?query=" +
    encodeURIComponent(title) +
    "&include_adult=false&language=ko-KR&page=1";
  let res = await fetch(url, {
    headers: { Authorization: "Bearer " + key, accept: "application/json" },
  });
  if (!res.ok) {
    url += "&api_key=" + encodeURIComponent(key);
    res = await fetch(url);
  }
  if (!res.ok) throw new Error("TMDB request failed");
  let d = await res.json(),
    h = (d.results || []).find((x) => x.poster_path);
  const image = h ? "https://image.tmdb.org/t/p/w500" + h.poster_path : "";
  cache[cacheKey] = image
    ? { url: image, savedAt: Date.now() }
    : { missing: true, savedAt: Date.now() };
  writePosterCache(cache);
  return image;
}
async function enrichRecords() {
  const key = localStorage.getItem("tmdbKey");
  if (!key) return;
  let changed = false;
  for (const r of records) {
    if (!r.poster) {
      try {
        const p = await fetchPoster(r.title, key);
        if (p) {
          r.poster = p;
          changed = true;
        }
      } catch (e) {}
    }
  }
  if (changed) {
    persist();
    render();
  }
}
async function enrichFavorites() {
  let key = localStorage.getItem("tmdbKey");
  if (!key) return;
  for (let f of favorites) {
    if (!f.poster) {
      try {
        f.poster = await fetchPoster(f.title, key);
      } catch (e) {}
    }
  }
  buildMarquee();
  persist();
}
