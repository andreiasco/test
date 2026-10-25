// Each collection has its own public route, data table and editorial fields.
const EDUCATION_COLLECTIONS = [
    {
        "key": "fise-vizuale",
        "parent": "elevi",
        "title": "Fișe vizuale",
        "icon": "magazine",
        "intro": "Recapitulează prin scheme, definiții și exemple. Alege clasa și tema care te interesează.",
        "bodyLabel": "Concepte și exemple",
        "table": "edu_fise_vizuale",
        "fields": [
            {
                "name": "topic",
                "label": "Tema",
                "kind": "select",
                "options": [
                    "Gramatică",
                    "Vocabular",
                    "Lectură"
                ]
            },
            {
                "name": "sheet_type",
                "label": "Formatul fișei",
                "kind": "select",
                "options": [
                    "Schemă",
                    "Sinteză",
                    "Exemple comentate"
                ]
            },
            {
                "name": "worked_example",
                "label": "Exemplu explicat",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "antrenament-examen",
        "parent": "elevi",
        "title": "Pregătire pentru Evaluarea Națională",
        "icon": "cap",
        "intro": "Antrenează-te pe domenii și verifică rezolvările după ce lucrezi cerințele.",
        "bodyLabel": "Cerințe",
        "table": "edu_antrenament_examen",
        "fields": [
            {
                "name": "exam_area",
                "label": "Domeniul",
                "kind": "select",
                "options": [
                    "Receptarea textului",
                    "Gramatică",
                    "Vocabular",
                    "Redactare",
                    "Test complet"
                ]
            },
            {
                "name": "duration_minutes",
                "label": "Timp recomandat (minute)",
                "kind": "number"
            },
            {
                "name": "answers",
                "label": "Rezolvări și explicații",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "exercitii-competente",
        "parent": "elevi",
        "title": "Exerciții pe competențe",
        "icon": "check",
        "intro": "Alege ce vrei să exersezi, lucrează cerințele și consultă apoi răspunsurile.",
        "bodyLabel": "Exerciții",
        "table": "edu_exercitii_competente",
        "fields": [
            {
                "name": "competence",
                "label": "Competența exersată",
                "kind": "text"
            },
            {
                "name": "difficulty",
                "label": "Nivel",
                "kind": "select",
                "options": [
                    "Consolidare",
                    "Aplicare",
                    "Aprofundare"
                ]
            },
            {
                "name": "answers",
                "label": "Răspunsuri și explicații",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "teste-bareme",
        "parent": "profesori",
        "title": "Teste și bareme",
        "icon": "check",
        "intro": "Evaluări organizate după clasă și momentul aplicării, cu durata, punctajul și baremul aferent.",
        "bodyLabel": "Subiecte",
        "table": "edu_teste_bareme",
        "fields": [
            {
                "name": "evaluation_type",
                "label": "Tipul evaluării",
                "kind": "select",
                "options": [
                    "Inițială",
                    "Pe unitate",
                    "Pe modul",
                    "Finală"
                ]
            },
            {
                "name": "duration_minutes",
                "label": "Durata (minute)",
                "kind": "number"
            },
            {
                "name": "max_score",
                "label": "Punctaj maxim",
                "kind": "number"
            },
            {
                "name": "rubric",
                "label": "Barem de corectare",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "resurse-ces",
        "parent": "profesori",
        "title": "Adaptări CES",
        "icon": "book",
        "intro": "Materiale diferențiate, cu tipul de sprijin și recomandări de adaptare explicate separat.",
        "bodyLabel": "Activitate adaptată",
        "table": "edu_resurse_ces",
        "fields": [
            {
                "name": "support_type",
                "label": "Tipul sprijinului",
                "kind": "select",
                "options": [
                    "Cerințe simplificate",
                    "Sprijin vizual",
                    "Activitate pe pași"
                ]
            },
            {
                "name": "adaptation_notes",
                "label": "Recomandări de adaptare",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "centralizatoare-swot",
        "parent": "profesori",
        "title": "Analiză și diagnoză",
        "icon": "chart",
        "intro": "Alege un centralizator sau un model SWOT potrivit scopului evaluării.",
        "bodyLabel": "Structura instrumentului",
        "table": "edu_centralizatoare_swot",
        "fields": [
            {
                "name": "analysis_type",
                "label": "Instrument",
                "kind": "select",
                "options": [
                    "Centralizator",
                    "Analiză SWOT"
                ]
            },
            {
                "name": "purpose",
                "label": "Scopul analizei",
                "kind": "text"
            },
            {
                "name": "strengths",
                "label": "Puncte tari",
                "kind": "textarea"
            },
            {
                "name": "weaknesses",
                "label": "Puncte slabe",
                "kind": "textarea"
            },
            {
                "name": "opportunities",
                "label": "Oportunități",
                "kind": "textarea"
            },
            {
                "name": "threats",
                "label": "Riscuri",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "planuri-interventie",
        "parent": "profesori",
        "title": "Planuri de intervenție",
        "icon": "folder",
        "intro": "Planuri de intervenție cu obiectiv, durată și criterii de verificare a progresului.",
        "bodyLabel": "Etape și activități",
        "table": "edu_planuri_interventie",
        "fields": [
            {
                "name": "objective",
                "label": "Obiectivul intervenției",
                "kind": "text"
            },
            {
                "name": "duration_weeks",
                "label": "Durata (săptămâni)",
                "kind": "number"
            },
            {
                "name": "success_criteria",
                "label": "Criterii de progres",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "activitati-remediale",
        "parent": "profesori",
        "title": "Fișe remediale",
        "icon": "magazine",
        "intro": "Activități de recuperare organizate după competență și nivel, cu răspunsuri pentru profesor.",
        "bodyLabel": "Cerințe",
        "table": "edu_activitati_remediale",
        "fields": [
            {
                "name": "competence",
                "label": "Competența vizată",
                "kind": "text"
            },
            {
                "name": "difficulty",
                "label": "Nivel",
                "kind": "select",
                "options": [
                    "Cu sprijin",
                    "Consolidare",
                    "Transfer"
                ]
            },
            {
                "name": "answers",
                "label": "Răspunsuri pentru profesor",
                "kind": "textarea"
            }
        ]
    },
    {
        "key": "documente-planificare",
        "parent": "profesori",
        "title": "Planificări și proiectări",
        "icon": "folder",
        "intro": "Documente organizate după tip, an școlar și unitate de învățare.",
        "bodyLabel": "Structura documentului",
        "table": "edu_documente_planificare",
        "fields": [
            {
                "name": "document_type",
                "label": "Tipul documentului",
                "kind": "select",
                "options": [
                    "Planificare anuală",
                    "Proiectare pe unitate",
                    "Proiect de lecție"
                ]
            },
            {
                "name": "school_year",
                "label": "An școlar (ex.: 2026–2027)",
                "kind": "text"
            },
            {
                "name": "unit_title",
                "label": "Unitatea / tema",
                "kind": "text"
            }
        ]
    },
    {
        "key": "creatii-elevi",
        "parent": "revista",
        "title": "Revista elevilor",
        "icon": "poetry",
        "intro": "Citește poezii, proză, recenzii și creații vizuale, fiecare cu autorul sau pseudonimul ales pentru publicare.",
        "bodyLabel": "Creația",
        "table": "edu_creatii_elevi",
        "fields": [
            {
                "name": "author_credit",
                "label": "Numele autorului sau pseudonimul",
                "kind": "text"
            },
            {
                "name": "creation_type",
                "label": "Tipul creației",
                "kind": "select",
                "options": [
                    "Poezie",
                    "Proză",
                    "Compunere",
                    "Recenzie",
                    "Desen"
                ]
            },
            {
                "name": "author_note",
                "label": "Notă despre creație",
                "kind": "text"
            }
        ]
    }
];
const EDUCATION_PARENTS = { elevi: "Biblioteca elevului", profesori: "Biblioteca profesorului", revista: "Reviste digitale" };
const EDUCATION_STATIC_ROUTES = ["informatii-adeverinte", "reguli-publicare"];
