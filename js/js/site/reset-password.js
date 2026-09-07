const RESET_PASSWORD_MIN_LENGTH = 12;

const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetPasswordMessage = document.getElementById("resetPasswordMessage");
const resetPasswordButton = document.getElementById("resetPasswordButton");

function resetPasswordIsStrong(password) {
    return password.length >= RESET_PASSWORD_MIN_LENGTH &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password);
}

function showResetPasswordMessage(text, isError = false) {
    resetPasswordMessage.textContent = text;
    resetPasswordMessage.classList.toggle("eroare", isError);
    resetPasswordMessage.classList.toggle("succes", !isError);
}

async function hasRecoverySession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    return Boolean(data && data.session);
}

async function handlePasswordReset(event) {
    event.preventDefault();

    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!resetPasswordIsStrong(password)) {
        showResetPasswordMessage(
            "Parola trebuie să aibă minimum 12 caractere, o literă mare, o literă mică și o cifră.",
            true
        );
        return;
    }

    if (password !== confirmPassword) {
        showResetPasswordMessage("Parolele nu coincid.", true);
        return;
    }

    resetPasswordButton.disabled = true;
    showResetPasswordMessage("Se salvează parola...");

    try {
        const { error } = await supabaseClient.auth.updateUser({ password });

        if (error) {
            throw error;
        }

        resetPasswordForm.reset();
        showResetPasswordMessage("Parola a fost schimbată. Poți intra acum în cont.");
        window.setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } catch (error) {
        console.error("Password reset error:", error);
        showResetPasswordMessage(
            "Linkul de resetare a expirat sau nu mai este valid. Solicită un link nou.",
            true
        );
        resetPasswordButton.disabled = false;
    }
}

async function initializePasswordReset() {
    try {
        if (!(await hasRecoverySession())) {
            resetPasswordForm.classList.add("ascuns");
            resetPasswordButton.classList.add("ascuns");
            showResetPasswordMessage(
                "Linkul de resetare nu este valid sau a expirat. Solicită un link nou.",
                true
            );
        }
    } catch (error) {
        console.error("Password reset session error:", error);
        resetPasswordForm.classList.add("ascuns");
        resetPasswordButton.classList.add("ascuns");
        showResetPasswordMessage(
            "Nu am putut verifica linkul de resetare. Solicită un link nou.",
            true
        );
    }
}

resetPasswordForm.addEventListener("submit", handlePasswordReset);
initializePasswordReset();
