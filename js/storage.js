function persist() {
  localStorage.setItem("cineArchiveRecordsV3", JSON.stringify(records));
  localStorage.setItem("cineArchiveFavorites", JSON.stringify(favorites));
}
$("search").addEventListener("input", render);
$("year").onchange = render;
$("sort").onchange = render;
document.querySelectorAll("[data-type]").forEach(
  (b) =>
    (b.onclick = () => {
      activeType = b.dataset.type;
      document
        .querySelectorAll("[data-type]")
        .forEach((x) => x.classList.toggle("active", x === b));
      render();
    }),
);
$("gridBtn").onclick = () => {
  view = "grid";
  $("gridBtn").classList.add("active");
  $("listBtn").classList.remove("active");
  render();
};
$("listBtn").onclick = () => {
  view = "list";
  $("listBtn").classList.add("active");
  $("gridBtn").classList.remove("active");
  render();
};
