// ======================================================
// LISTĂ OPERE ADMIN - ACCORDION
// ======================================================


// ======================================================
// DESCHIDERE / ÎNCHIDERE OPERĂ
// ======================================================

function toggleOperaAdmin(operaId) {

    const detaliiCurente =
        document.getElementById(
            `operaDetalii-${operaId}`
        );

    const butonCurent =
        document.getElementById(
            `operaTitlu-${operaId}`
        );

    const sageataCurenta =
        document.getElementById(
            `operaSageata-${operaId}`
        );

    if (!detaliiCurente) {
        return;
    }


    const eraDeschis =
        !detaliiCurente.hidden;


    // ==================================================
    // ÎNCHIDEM TOATE OPERELE
    // ==================================================

    document
        .querySelectorAll(".admin-opera-detalii")
        .forEach(detalii => {

            detalii.hidden = true;

        });


    document
        .querySelectorAll(".admin-opera-titlu")
        .forEach(buton => {

            buton.setAttribute(
                "aria-expanded",
                "false"
            );

        });


    document
        .querySelectorAll(".admin-opera-sageata")
        .forEach(sageata => {

            sageata.textContent = "▶";

        });


    // ==================================================
    // DACĂ ERA ÎNCHISĂ, O DESCHIDEM
    // ==================================================

    if (!eraDeschis) {

        detaliiCurente.hidden = false;


        if (butonCurent) {

            butonCurent.setAttribute(
                "aria-expanded",
                "true"
            );
        }


        if (sageataCurenta) {

            sageataCurenta.textContent =
                "▼";
        }
    }
}



// ======================================================
// ÎNCĂRCARE OPERE
// ======================================================

async function incarcaOpereAdmin() {

    const container =
        document.getElementById(
            "listaOpereAdmin"
        );


    if (!container) {
        return;
    }


    try {

        // ==================================================
        // CITIM OPERELE
        // ==================================================

        const {
            data: opere,
            error: eroareOpere
        } = await supabaseClient
            .from("opere")
            .select("*")
            .order(
                "titlu",
                {
                    ascending: true
                }
            );


        if (eroareOpere) {
            throw eroareOpere;
        }



        // ==================================================
        // CITIM AUTORII
        // ==================================================

        const {
            data: autori,
            error: eroareAutori
        } = await supabaseClient
            .from("autori")
            .select(
                "id, initiale, nume"
            );


        if (eroareAutori) {
            throw eroareAutori;
        }



        // ==================================================
        // DACĂ NU EXISTĂ OPERE
        // ==================================================

        if (
            !opere ||
            opere.length === 0
        ) {

            container.innerHTML =
                "<p>Nu există opere.</p>";

            return;
        }



        // ==================================================
        // GENERARE LISTĂ
        // ==================================================

        container.innerHTML =
            opere.map(opera => {


                // ==========================================
                // AUTORUL OPEREI
                // ==========================================

                const autor =
                    (autori || []).find(
                        a =>
                            String(a.id) ===
                            String(opera.autor_id)
                    );


                const numeAutor =
                    autor
                        ? autor.nume
                        : "Necunoscut";


                // ==========================================
                // STATUS PROFESOR AI
                // ==========================================

                const areTextAI =
                    [
                        opera.continut_rezumat,
                        opera.continut_analiza_literara,
                        opera.continut_valori_morale,
                        opera.continut_caracterizare
                    ].some(Boolean);



                return `

                    <div
                        class="admin-opera admin-opera-acordeon"
                        id="operaAdmin-${opera.id}"
                    >


                        <!-- =================================
                             TITLU OPERĂ
                        ================================== -->

                        <button
                            type="button"
                            class="admin-opera-titlu"
                            id="operaTitlu-${opera.id}"
                            aria-expanded="false"
                            aria-controls="operaDetalii-${opera.id}"
                            onclick="toggleOperaAdmin(${opera.id})"
                        >

                            <span
                                class="admin-opera-sageata"
                                id="operaSageata-${opera.id}"
                            >
                                ▶
                            </span>

                            <strong>
                                📖 ${escapeHTML(opera.titlu)}
                            </strong>

                        </button>



                        <!-- =================================
                             DETALII OPERĂ
                        ================================== -->

                        <div
                            class="admin-opera-detalii"
                            id="operaDetalii-${opera.id}"
                            hidden
                        >


                            <!-- =============================
                                 AUTOR
                            ============================== -->

                            <p>
                                Autor:
                                <b>
                                    ${escapeHTML(
                                        numeAutor
                                    )}
                                </b>
                            </p>



                            <!-- =============================
                                 PROFESOR AI
                            ============================== -->

                            <p>

                                Profesor AI:

                                ${
                                    areTextAI
                                        ? "🤖 Are text indexat"
                                        : "⚠ Materialele nu sunt încă indexate"
                                }

                            </p>


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="indexeazaPDFuriOpera(${opera.id})"
                            >

                                🤖 Indexează materialele pentru AI

                            </button>



                            <!-- =============================
                                 REZUMAT PDF
                            ============================== -->

                            <p>

                                Rezumat PDF:

                                ${
                                    opera.pdf
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="file"
                                id="pdfRezumat-${opera.id}"
                                name="pdfRezumat-${opera.id}"
                                accept="application/pdf"
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiestePDF(
                                    ${opera.id},
                                    'pdf',
                                    'pdfRezumat-${opera.id}'
                                )"
                            >

                                📕 Înlocuiește rezumatul PDF

                            </button>



                            <!-- =============================
                                 ANALIZĂ LITERARĂ
                            ============================== -->

                            <p>

                                Analiză literară:

                                ${
                                    opera.pdf_analiza_literara
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="file"
                                id="pdfAnalizaLiterara-${opera.id}"
                                name="pdfAnalizaLiterara-${opera.id}"
                                accept="application/pdf"
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiestePDF(
                                    ${opera.id},
                                    'pdf_analiza_literara',
                                    'pdfAnalizaLiterara-${opera.id}'
                                )"
                            >

                                📚 Înlocuiește analiza literară

                            </button>



                            <!-- =============================
                                 VALORI MORALE
                            ============================== -->

                            <p>

                                Valori morale:

                                ${
                                    opera.pdf_valori_morale
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="file"
                                id="pdfValori-${opera.id}"
                                name="pdfValori-${opera.id}"
                                accept="application/pdf"
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiestePDF(
                                    ${opera.id},
                                    'pdf_valori_morale',
                                    'pdfValori-${opera.id}'
                                )"
                            >

                                ❤️ Înlocuiește valorile morale

                            </button>



                            <!-- =============================
                                 CARACTERIZARE
                            ============================== -->

                            <p>

                                Caracterizare:

                                ${
                                    opera.pdf_caracterizare
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="file"
                                id="pdfCaracterizare-${opera.id}"
                                name="pdfCaracterizare-${opera.id}"
                                accept="application/pdf"
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiestePDF(
                                    ${opera.id},
                                    'pdf_caracterizare',
                                    'pdfCaracterizare-${opera.id}'
                                )"
                            >

                                👤 Înlocuiește caracterizarea

                            </button>



                            <!-- =============================
                                 REZUMAT WORD
                            ============================== -->

                            <p>

                                Rezumat scris:

                                ${
                                    opera.rezumat_word
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="file"
                                id="rezumatWord-${opera.id}"
                                name="rezumatWord-${opera.id}"
                                accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiesteFisierOpera(
                                    ${opera.id},
                                    'rezumat_word',
                                    'rezumatWord-${opera.id}',
                                    'Pdf',
                                    'word'
                                )"
                            >

                                📄 Înlocuiește rezumatul scris

                            </button>



                            <!-- =============================
                                 FILM
                            ============================== -->

                            <p>

                                Film:

                                ${
                                    opera.link_film
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="url"
                                id="linkFilm-${opera.id}"
                                name="linkFilm-${opera.id}"
                                placeholder="https://..."
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiesteLinkOpera(
                                    ${opera.id},
                                    'link_film',
                                    'linkFilm-${opera.id}'
                                )"
                            >

                                🎬 Înlocuiește linkul filmului

                            </button>



                            <!-- =============================
                                 AUDIOBOOK
                            ============================== -->

                            <p>

                                Audiobook:

                                ${
                                    opera.link_audiobook
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="url"
                                id="linkAudiobook-${opera.id}"
                                name="linkAudiobook-${opera.id}"
                                placeholder="https://..."
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiesteLinkOpera(
                                    ${opera.id},
                                    'link_audiobook',
                                    'linkAudiobook-${opera.id}'
                                )"
                            >

                                🎧 Înlocuiește linkul audiobookului

                            </button>



                            <!-- =============================
                                 TEST DE LECTURĂ
                            ============================== -->

                            <p>

                                Test de lectură:

                                ${
                                    opera.link_test_lectura
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="url"
                                id="linkTestLectura-${opera.id}"
                                name="linkTestLectura-${opera.id}"
                                placeholder="https://..."
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiesteLinkOpera(
                                    ${opera.id},
                                    'link_test_lectura',
                                    'linkTestLectura-${opera.id}'
                                )"
                            >

                                📝 Înlocuiește linkul testului

                            </button>



                            <!-- =============================
                                 PERSONAJE INSTAGRAM
                            ============================== -->

                            <p>

                                Document personaje Instagram:

                                ${
                                    opera.personaje_instagram
                                        ? "✔ Există"
                                        : "✖ Lipsește"
                                }

                            </p>


                            <input
                                type="file"
                                id="personajeInstagram-${opera.id}"
                                name="personajeInstagram-${opera.id}"
                                accept="application/pdf"
                            >


                            <button
                                class="admin-btn"
                                type="button"
                                onclick="inlocuiesteFisierOpera(
                                    ${opera.id},
                                    'personaje_instagram',
                                    'personajeInstagram-${opera.id}',
                                    'Pdf',
                                    'pdf'
                                )"
                            >

                                📄 Înlocuiește documentul Instagram

                            </button>



                            <!-- =============================
                                 STATUS
                            ============================== -->

                            <div
                                id="inlocuireStatus-${opera.id}"
                                class="admin-status"
                            >
                            </div>



                            <hr>



                            <!-- =============================
                                 ȘTERGERE OPERĂ
                            ============================== -->

                            <button
                                class="admin-btn sterge-opera-btn"
                                type="button"
                                onclick="stergeOpera(${opera.id})"
                            >

                                🗑️ Șterge opera

                            </button>


                        </div>

                    </div>

                `;

            }).join("");


    } catch (error) {

        console.error(error);


        container.innerHTML = `

            <p style="color:#c62828">

                ${escapeHTML(
                    error.message
                )}

            </p>

        `;
    }
}