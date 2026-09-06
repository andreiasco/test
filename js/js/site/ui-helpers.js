// ======================================================
// BUTON SEARCH
// ======================================================

const searchToggle =
    document.getElementById("searchToggle");

const searchContainer =
    document.querySelector(".search-container");


searchToggle.addEventListener("click", function () {

    searchContainer.classList.toggle("ascuns");

    if (!searchContainer.classList.contains("ascuns")) {

        searchInput.focus();

    }

});


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}

function golesteCampuri(...iduri) {

    iduri.forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.value = "";
        }

    });
}

