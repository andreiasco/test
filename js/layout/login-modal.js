// Componentă de layout: login-modal.js
const LOGIN_MODAL_HTML = `

<div
    id="loginModal"
    class="login-modal ascuns">

    <div class="login-box">

        <button
            class="inchide-login"
            onclick="inchideLogin()">

            ✕

        </button>

        <h2>🔐 Contul tău</h2>

        <div class="auth-tabs">
            <button id="loginTab" class="auth-tab activ" onclick="schimbaAuthForm('login')">Logare</button>
            <button id="registerTab" class="auth-tab" onclick="schimbaAuthForm('register')">Register</button>
        </div>

        <div id="loginForm" class="auth-form">
            <p>Intră în contul tău.</p>
            <input type="email" id="loginEmail" placeholder="Email">
            <input type="password" id="loginPassword" placeholder="Parolă">
            <button class="login-btn" onclick="loginUtilizator()">🔐 Logare</button>
            <button class="login-btn reset-btn" type="button" onclick="reseteazaParola()">🔑 Am uitat parola</button>
        </div>

        <div id="registerForm" class="auth-form ascuns">
            <p>Creează un cont de profesor sau elev.</p>
            <input type="email" id="registerEmail" placeholder="Email">
            <input type="password" id="registerPassword" placeholder="Parolă (minimum 6 caractere)">
            <select id="registerRole">
                <option value="elev">Elev</option>
                <option value="profesor">Profesor</option>
            </select>
            <button class="login-btn" onclick="inregistreazaUtilizator()">📝 Creează cont</button>
        </div>

        <p id="loginMesaj"></p>

    </div>

</div>
`;
