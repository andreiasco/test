// ======================================================
// LISTĂ OPERE ADMIN
// ======================================================

async function incarcaOpereAdmin() {

    const container =
        document.getElementById("listaOpereAdmin");

    if (!container) {
        return;
    }

    try {

        const {
            data: opere,
            error: eroareOpere
        } = await supabaseClient
            .from("opere")
            .select("*")
            .order("titlu", {
                ascending: true
            });

        if (eroareOpere) {
            throw eroareOpere;
        }

        const {
            data: autori,
            error: eroareAutori
        } = await supabaseClient
            .from("autori")
            .select("id, initiale, nume");

        if (eroareAutori) {
            throw eroareAutori;
        }

        if (!opere || opere.length === 0) {

            container.innerHTML =
                "<p>Nu există opere.</p>";

            return;
        }

        container.innerHTML =
            opere.map(opera => {

                const autor =
                    (autori || []).find(
                        a =>
                            String(a.id) ===
                            String(opera.autor_id)
                    );

                return `

                    <div class="admin-opera">

                        <strong>
                            📖 ${escapeHTML(opera.titlu)}
                        </strong>

                        <p>
                            Autor:
                            <b>
                                ${escapeHTML(
                    autor
                        ? autor.nume
                        : "Necunoscut"
                )}
                            </b>
                        </p>


                        <!-- =========================
                             REZUMAT
                        ========================== -->

                        <p>
                            Rezumat:
                            ${opera.pdf
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfRezumat-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf',
                                'pdfRezumat-${opera.id}'
                            )">

                            📕 Înlocuiește rezumatul

                        </button>

                        <p>
                            Analiză literară:
                            ${opera.pdf_analiza_literara
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfAnalizaLiterara-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf_analiza_literara',
                                'pdfAnalizaLiterara-${opera.id}'
                            )">

                            📚 Înlocuiește analiza literară

                        </button>


                        <!-- =========================
                             VALORI MORALE
                        ========================== -->

                        <p>
                            Valori morale:
                            ${opera.pdf_valori_morale
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfValori-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf_valori_morale',
                                'pdfValori-${opera.id}'
                            )">

                            ❤️ Înlocuiește valorile morale

                        </button>


                        <!-- =========================
                             CARACTERIZARE
                        ========================== -->

                        <p>
                            Caracterizare:
                            ${opera.pdf_caracterizare
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfCaracterizare-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf_caracterizare',
                                'pdfCaracterizare-${opera.id}'
                            )">

                            👤 Înlocuiește caracterizarea

                        </button>

                        <p>
                            Rezumat scris:
                            ${opera.rezumat_word
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="rezumatWord-${opera.id}"
                            accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteFisierOpera(
                                ${opera.id},
                                'rezumat_word',
                                'rezumatWord-${opera.id}',
                                'Pdf',
                                'word'
                            )">

                            📄 Înlocuiește rezumatul scris

                        </button>

                        <p>
                            Film:
                            ${opera.link_film ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="url"
                            id="linkFilm-${opera.id}"
                            placeholder="https://...">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteLinkOpera(${opera.id}, 'link_film', 'linkFilm-${opera.id}')">

                            🎬 Înlocuiește linkul filmului

                        </button>

                        <p>
                            Audiobook:
                            ${opera.link_audiobook ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="url"
                            id="linkAudiobook-${opera.id}"
                            placeholder="https://...">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteLinkOpera(${opera.id}, 'link_audiobook', 'linkAudiobook-${opera.id}')">

                            🎧 Înlocuiește linkul audiobookului

                        </button>

                        <p>
                            Test de lectură:
                            ${opera.link_test_lectura ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="url"
                            id="linkTestLectura-${opera.id}"
                            placeholder="https://...">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteLinkOpera(${opera.id}, 'link_test_lectura', 'linkTestLectura-${opera.id}')">

                            📝 Înlocuiește linkul testului

                        </button>

                        <p>
                            Document personaje Instagram:
                            ${opera.personaje_instagram ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="file"
                            id="personajeInstagram-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteFisierOpera(
                                ${opera.id},
                                'personaje_instagram',
                                'personajeInstagram-${opera.id}',
                                'Pdf',
                                'pdf'
                            )">

                            📄 Înlocuiește documentul Instagram

                        </button>


                        <div
                            id="inlocuireStatus-${opera.id}"
                            class="admin-status">
                        </div>


                        <hr>


                        <button
                            class="admin-btn sterge-opera-btn"
                            type="button"
                            onclick="stergeOpera(${opera.id})">

                            🗑️ Șterge opera

                        </button>

                    </div>

                `;

            }).join("");


    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<p style="color:#c62828">
                ${escapeHTML(error.message)}
            </p>`;
    }
}

