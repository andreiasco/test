// Tab de cont pentru rolul profesor - fara continut momentan.
let rolContActiv = null;
let profilProfesorUser = null;

function activeazaProfilProfesor(user) {
    rolContActiv = "profesor";
    profilProfesorUser = user;
    document.getElementById("profileButton")?.classList.remove("ascuns");
}

function deschideProfilProfesor() {
    if (!profilProfesorUser) {
        afiseazaLogin();
        return;
    }
    const email = document.getElementById("profileEmail");
    if (email) email.textContent = profilProfesorUser.email || "Profesor conectat";
    document.getElementById("profileElevContent")?.classList.add("ascuns");
    document.getElementById("profileProfesorContent")?.classList.remove("ascuns");
    document.getElementById("profileModal")?.classList.remove("ascuns");
}
