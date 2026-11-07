document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") {
    e.preventDefault();
    exportData();
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
    e.preventDefault();
    let input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => input.files[0] && importJSON(input.files[0]);
    input.click();
  }
});
if (yearPage) {
  document.title = "CINÉ ARCHIVE · " + yearPage;
  const t = yearPageParams.get("type");
  if (t) activeType = t;
  const sv = yearPageParams.get("sort");
  if (sv) $("sort").value = sv;
  const vv = yearPageParams.get("view");
  if (vv === "list" || vv === "grid") view = vv;
  const qq = yearPageParams.get("q");
  if (qq) $("search").value = qq;
  $("yearPageBack").style.display = "inline-flex";
  $("filters").style.display = "none";
  $("year").style.display = "none";
  $("yearPageBack").style.display = "inline-flex";
}
let saved = localStorage.getItem("cineArchiveRecordsV3");
if (saved) {
  try {
    records = JSON.parse(saved);
  } catch (e) {}
}
let favSaved = localStorage.getItem("cineArchiveFavorites");
if (favSaved) {
  try {
    favorites = JSON.parse(favSaved);
  } catch (e) {}
}
$("total").textContent = records.length.toLocaleString();
$("movies").textContent = records
  .filter((x) => x.type === "F")
  .length.toLocaleString();
$("series").textContent = records
  .filter((x) => x.type === "S" || x.type === "A")
  .length.toLocaleString();
populateYears();
buildMarquee();
render();
enrichRecords();
enrichFavorites();
