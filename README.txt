CINÉ ARCHIVE source structure

index.html
style.css
js/
  data.js        Embedded archive records (initial data)
  state.js       Shared state and common helpers
  archive.js     Archive rendering, year groups, cards and filtering
  posters.js     Poster cache and automatic poster lookup
  storage.js     Local persistence and basic UI event bindings
  data-tools.js  JSON / CSV / Google Sheets import and export
  app.js         Keyboard shortcuts, year-page setup and app startup

Keep this folder structure unchanged. Open index.html in a browser.
All JavaScript files are loaded as ordered classic scripts with defer.
They intentionally share the same global lexical scope; do not add type="module"
unless the code is refactored to use explicit imports and exports.
