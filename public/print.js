// The print pages' one script (src/lib/printSheet.ts printPageHtml). Before printing it measures the sheet as it will
// come out on paper and scales it down when it's too tall for one page (the same rule as zoomFor and measureSheet in
// printSheet.ts); the Print button opens the print window. It changes nothing until then, so a page React draws
// hydrates as it was served. scripts/program-pdfs.mjs calls liftsmithFitSheet() before saving each PDF.
(function () {
  var PAGE_MM = 252;
  function fit() {
    var sheet = document.querySelector(".ps-sheet");
    if (!sheet) return 1;
    var box = document.createElement("div");
    box.className = "ps-measure";
    box.appendChild(sheet.cloneNode(true));
    document.body.appendChild(box);
    var mm = (box.getBoundingClientRect().height * 25.4) / 96;
    box.remove();
    var zoom = mm <= PAGE_MM ? 1 : Math.max(0.75, Math.floor((PAGE_MM / mm) * 100) / 100);
    if (zoom < 1) sheet.style.setProperty("--ps-zoom", String(zoom));
    else sheet.style.removeProperty("--ps-zoom");
    return zoom;
  }
  window.liftsmithFitSheet = fit;
  window.addEventListener("beforeprint", fit);
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest("[data-print]")) {
      fit();
      window.print();
    }
  });
})();
