// Componentă de layout: quiz-page.js
const QUIZ_HTML = `

<div id="pagina-quiz" class="pagina">

<section id="quiz">

    <h2 class="titlu">
        Quiz-uri 🎮
    </h2>

    <p class="subtitlu">
        Alege platforma pe care vrei să exersezi.
    </p>

    <div class="quiz-selectie">

        <button
            class="quiz-tab kahoot activ"
            onclick="arataQuiz('kahoot')">

            🎯 Kahoot

        </button>

        <button
            class="quiz-tab wordwall"
            onclick="arataQuiz('wordwall')">

            🧩 Wordwall

        </button>

    </div>


    <div id="kahoot" class="quizuri">

        <div class="kahoot-card">

            <h3>
                📝 Aplicarea regulilor în contexte noi
            </h3>

            <p>
                Exersează aplicarea regulilor de limbă română.
            </p>

            <a
                class="kahoot-link"
                href="https://play.kahoot.it/v2/?quizId=071aa0d4-21d3-426f-a7a3-4c8ab375d61b&hostId=abe4ceb9-8934-4647-a7f8-ee81f1f1ac7c"
                target="_blank"
                rel="noopener noreferrer">

                🎯 Deschide Kahoot

            </a>

        </div>


        <div class="kahoot-card">

            <h3>
                📚 Romanian Vocabulary in Context
            </h3>

            <p>
                Exersează vocabularul românesc.
            </p>

            <a
                class="kahoot-link"
                href="https://play.kahoot.it/v2/?quizId=bf406337-3185-409c-92c7-22471cf41e38&hostId=abe4ceb9-8934-4647-a7f8-ee81f1f1ac7c"
                target="_blank"
                rel="noopener noreferrer">

                🎯 Deschide Kahoot

            </a>

        </div>

    </div>


    <div
        id="wordwall"
        class="quizuri ascuns">

        <div class="quiz-card">

            <h3>
                🔤 Conjuncții de coordonare
            </h3>

            <iframe
                src="https://www.wordwall.net/resource/71605201/limba-rom%C3%A2n%C4%83/conjunc%C8%9Bii-coordonare"
                allowfullscreen>
            </iframe>

        </div>


        <div class="quiz-card">

            <h3>
                ✍️ Recapitulare – Verbul
            </h3>

            <iframe
                src="https://www.wordwall.net/resource/71415598/limba-rom%C3%A2n%C4%83/recapitulare-vi-viii-verbul"
                allowfullscreen>
            </iframe>

        </div>

    </div>

</section>

</div>
`;
