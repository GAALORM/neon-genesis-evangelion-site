document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.endsWith(".html")) {
        let newUrl = window.location.pathname.replace(".html", "");
        window.history.replaceState(null, "", newUrl);
    }
});
