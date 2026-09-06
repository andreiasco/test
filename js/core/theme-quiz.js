// ======================================================
// DARK MODE
// ======================================================

function schimbaTema() {

    document.body.classList.toggle(
        "dark"
    );

}


// ======================================================
// QUIZ
// ======================================================

function arataQuiz(tip) {

    const kahoot =
        document.getElementById(
            "kahoot"
        );


    const wordwall =
        document.getElementById(
            "wordwall"
        );


    const butoane =
        document.querySelectorAll(
            ".quiz-tab"
        );


    if (tip === "kahoot") {

        kahoot.classList.remove(
            "ascuns"
        );

        wordwall.classList.add(
            "ascuns"
        );

        butoane[0].classList.add(
            "activ"
        );

        butoane[1].classList.remove(
            "activ"
        );

    } else {

        kahoot.classList.add(
            "ascuns"
        );

        wordwall.classList.remove(
            "ascuns"
        );

        butoane[0].classList.remove(
            "activ"
        );

        butoane[1].classList.add(
            "activ"
        );

    }
}


