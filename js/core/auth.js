// ======================================================
// LOGIN MODAL
// ======================================================

function afiseazaLogin() {

    document
        .getElementById(
            "loginModal"
        )
        .classList.remove(
            "ascuns"
        );


    document
        .getElementById(
            "loginEmail"
        )
        .focus();

}


function inchideLogin() {

    document
        .getElementById(
            "loginModal"
        )
        .classList.add(
            "ascuns"
        );


    document
        .getElementById(
            "loginMesaj"
        )
        .textContent = "";

}


// ======================================================
// LOGIN ȘI REGISTER
// ======================================================

function schimbaAuthForm(formular) {

    const esteRegister = formular === "register";

    document.getElementById("loginForm").classList.toggle("ascuns", esteRegister);
    document.getElementById("registerForm").classList.toggle("ascuns", !esteRegister);
    document.getElementById("loginTab").classList.toggle("activ", !esteRegister);
    document.getElementById("registerTab").classList.toggle("activ", esteRegister);
    document.getElementById("loginMesaj").textContent = "";

}

async function loginUtilizator() {

    const email =
        document
            .getElementById(
                "loginEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "loginPassword"
            )
            .value;


    const mesaj =
        document.getElementById(
            "loginMesaj"
        );


    if (
        !email ||
        !password
    ) {

        mesaj.textContent =
            "Completează emailul și parola.";

        mesaj.style.color =
            "#c62828";

        return;

    }


    mesaj.textContent =
        "Se verifică datele...";

    mesaj.style.color =
        "#7b2450";


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email:
                        email,

                    password:
                        password
                });


        if (error) {

            throw error;

        }


        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "Autentificarea nu a reușit."
            );

        }


        inchideLogin();

        actualizeazaStareAutentificare(data.user);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        mesaj.textContent =
            "Email sau parolă incorectă.";

        mesaj.style.color =
            "#c62828";

    }
}

async function inregistreazaUtilizator() {

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const role = document.getElementById("registerRole").value;
    const mesaj = document.getElementById("loginMesaj");

    if (!email || !password || !["elev", "profesor"].includes(role)) {
        mesaj.textContent = "Completează toate câmpurile și alege un rol valid.";
        mesaj.style.color = "#c62828";
        return;
    }

    if (password.length < 6) {
        mesaj.textContent = "Parola trebuie să aibă minimum 6 caractere.";
        mesaj.style.color = "#c62828";
        return;
    }

    mesaj.textContent = "Se creează contul...";
    mesaj.style.color = "#7b2450";

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role
                }
            }
        });

        if (error) {
            throw error;
        }

        if (data.session && data.user) {
            inchideLogin();
            actualizeazaStareAutentificare(data.user);
        } else {
            mesaj.textContent = "Cont creat. Verifică emailul pentru confirmare, apoi conectează-te.";
            mesaj.style.color = "#2e7d32";
        }
    } catch (error) {
        console.error("Register error:", error);
        mesaj.textContent = "Nu am putut crea contul: " + error.message;
        mesaj.style.color = "#c62828";
    }
}

function loginAdmin() {
    return loginUtilizator();
}


// ======================================================
// RESETARE PAROLĂ
// ======================================================

async function reseteazaParola() {

    const email =
        document
            .getElementById(
                "loginEmail"
            )
            .value
            .trim();


    const mesaj =
        document.getElementById(
            "loginMesaj"
        );


    if (!email) {

        mesaj.textContent =
            "Introdu emailul pentru resetarea parolei.";

        mesaj.style.color =
            "#c62828";

        return;

    }


    mesaj.textContent =
        "Se trimite emailul de resetare...";

    mesaj.style.color =
        "#7b2450";


    try {

        const {
            error
        } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            window.location.origin +
                            "/reset-password.html"
                    }
                );


        if (error) {

            throw error;

        }


        mesaj.textContent =
            "Emailul de resetare a fost trimis. Verifică Inbox și Spam.";

        mesaj.style.color =
            "#2e7d32";


    } catch (error) {

        console.error(
            "Eroare resetare parolă:",
            error
        );

        mesaj.textContent =
            "Nu am putut trimite emailul: " +
            error.message;

        mesaj.style.color =
            "#c62828";

    }
}


// ======================================================
// AFIȘEAZĂ ADMIN
// ======================================================

async function obtineRolUtilizator(user) {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error);
        return null;
    }

    return data ? data.role : null;
}

function actualizeazaStareAutentificare(user) {

    const status = document.getElementById("authStatus");
    const logoutButton = document.getElementById("logoutButton");

    if (!status || !logoutButton) {
        return;
    }

    status.textContent = "Signed in: " + (user.email || "utilizator");
    status.classList.add("signed-in");
    logoutButton.classList.remove("ascuns");
    if (typeof setAiAccess === "function") setAiAccess(true);

}

function actualizeazaStareDelogata() {

    const status = document.getElementById("authStatus");
    const logoutButton = document.getElementById("logoutButton");

    if (!status || !logoutButton) {
        return;
    }

    status.textContent = "Signed out";
    status.classList.remove("signed-in");
    logoutButton.classList.add("ascuns");
    if (typeof setAiAccess === "function") setAiAccess(false);

}

async function afiseazaAdmin(user) {

    const panel =
        document.getElementById(
            "adminPanel"
        );


    const adminUser =
        document.getElementById(
            "adminUser"
        );

    const adminLink =
        document.getElementById("adminLink");


    if (
        !panel ||
        !adminUser
    ) {

        return;

    }


    const role = await obtineRolUtilizator(user);

    if (role !== "admin") {
        panel.classList.add("ascuns");

        if (adminLink) {
            adminLink.classList.add("ascuns");
        }

        if (estePaginaAdmin) {
            window.location.replace("index.html");
        }

        return;
    }

    panel.classList.toggle("ascuns", !estePaginaAdmin);

    if (adminLink) {
        adminLink.classList.remove("ascuns");
    }


    adminUser.textContent =
        "Conectat ca: " +
        user.email;


    incarcaListaPDF();
    incarcaAutoriAdmin();
    incarcaOpereAdmin();
    incarcaListaAutoriSelect();
    incarcaLimbaAdmin();
    if (typeof initializeazaQuizAdmin === "function") initializeazaQuizAdmin();
    if (typeof incarcaQuizuriAdmin === "function") incarcaQuizuriAdmin();

}


// ======================================================
// LOGOUT
// ======================================================

async function logoutUtilizator() {

    try {

        const {
            error
        } =
            await supabaseClient.auth
                .signOut();


        if (error) {

            throw error;

        }


        document.getElementById("adminPanel").classList.add("ascuns");
        actualizeazaStareDelogata();

        if (estePaginaAdmin) {
            window.location.replace("index.html");
        }


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Nu am putut realiza deconectarea."
        );

    }
}

function logoutAdmin() {
    return logoutUtilizator();
}


// ======================================================
// UTILIZATOR AUTENTIFICAT
// ======================================================

async function utilizatorAutentificat() {

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            error
        );

        return null;

    }


    if (
        !data ||
        !data.session
    ) {

        return null;

    }


    const user = data.session.user;
    const role = await obtineRolUtilizator(user);

    if (role !== "admin") {
        return null;
    }

    return user;
}


// ======================================================
// VERIFICĂ SESIUNEA
// ======================================================

async function verificaSesiunea() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();


        if (error) {

            throw error;

        }


        if (
            data &&
            data.session
        ) {

            actualizeazaStareAutentificare(data.session.user);

            afiseazaAdmin(
                data.session.user
            );

        } else {

            actualizeazaStareDelogata();

            if (estePaginaAdmin) {
                window.location.replace("index.html");
            }

        }


    } catch (error) {

        console.error(
            "Session error:",
            error
        );

    }
}


// ======================================================
// AUTH STATE
// ======================================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Auth:",
            event
        );


        if (session) {

            actualizeazaStareAutentificare(session.user);

            afiseazaAdmin(
                session.user
            );

        } else {

            actualizeazaStareDelogata();

            const panel =
                document.getElementById(
                    "adminPanel"
                );


            if (panel) {

                panel.classList.add(
                    "ascuns"
                );

            }

            const adminLink =
                document.getElementById("adminLink");

            if (adminLink) {
                adminLink.classList.add("ascuns");
            }

            if (estePaginaAdmin) {
                window.location.replace("index.html");
            }

        }

    }
);


// ======================================================
// TASTE LOGIN
// ======================================================

document.addEventListener(
    "keydown",
    function (event) {

        const modal =
            document.getElementById(
                "loginModal"
            );


        if (
            event.key === "Enter" &&
            modal &&
            !modal.classList.contains(
                "ascuns"
            )
        ) {

            loginAdmin();

        }


        if (
            event.key === "Escape" &&
            modal &&
            !modal.classList.contains(
                "ascuns"
            )
        ) {

            inchideLogin();

        }

    }
);


// ======================================================
