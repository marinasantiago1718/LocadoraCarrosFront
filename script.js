const API_USERS = "https://userservice-u3s8.onrender.com/users";
const API_VEICULOS = "https://ms-veiculos.onrender.com/api/veiculos";

let userLogged = null;
let editandoVeiculoId = null;

/* ---------- Helper ---------- */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/\'/g, "&#039;");
}

/* ---------- Detectar página ---------- */
document.addEventListener("DOMContentLoaded", () => {
    const raw = sessionStorage.getItem("userLogged");
    if (raw) {
        try { userLogged = JSON.parse(raw); } catch(e) {}
    }

    if (document.getElementById("auth-wrapper")) initLoginPage();
    if (document.getElementById("app")) initAppPage();
});

/* ================= LOGIN ================== */
function initLoginPage() {
    const loginCard = document.getElementById("login-card");
    const cadastroCard = document.getElementById("cadastro-card");

    document.getElementById("toCadastro").onclick = () => {
        loginCard.classList.add("hidden");
        cadastroCard.classList.remove("hidden");
    };
    document.getElementById("toLogin").onclick = () => {
        cadastroCard.classList.add("hidden");
        loginCard.classList.remove("hidden");
    };

    document.getElementById("btnCadastrar").onclick = criarContaHandler;
    document.getElementById("btnLogin").onclick = loginHandler;

    if (userLogged) window.location.href = "app.html";
}

async function criarContaHandler() {
    const nome = document.getElementById("cadNome").value.trim();
    const email = document.getElementById("cadEmail").value.trim();
    const senha = document.getElementById("cadSenha").value;

    if (!nome || !email || !senha) return alert("Preencha tudo.");

    try {
        const resp = await fetch(API_USERS, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({name: nome, email, senha})
        });

        if (!resp.ok) throw new Error(await resp.text());

        alert("Conta criada!");
        document.getElementById("cadastro-card").classList.add("hidden");
        document.getElementById("login-card").classList.remove("hidden");
        document.getElementById("loginEmail").value = email;

    } catch (e) {
        alert("Erro ao criar conta.");
        console.error(e);
    }
}

async function loginHandler() {
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) return alert("Digite o email.");

    try {
        const resp = await fetch(API_USERS);
        const list = await resp.json();
        const u = list.find(x => x.email === email);

        if (!u) return alert("Usuário não encontrado.");

        sessionStorage.setItem("userLogged", JSON.stringify(u));
        window.location.href = "app.html";

    } catch (err) {
        alert("Erro ao logar.");
        console.error(err);
    }
}

/* =============== APP PAGE ================= */
function initAppPage() {
    if (!userLogged) return window.location.href = "index.html";

    document.getElementById("app").classList.remove("hidden");

    document.getElementById("userName").textContent = userLogged.name;
    document.getElementById("editName").value = userLogged.name;
    document.getElementById("editEmail").value = userLogged.email;

    document.getElementById("btnLogout").onclick = () => {
        sessionStorage.removeItem("userLogged");
        window.location.href = "index.html";
    };

    document.getElementById("btnUpdateUser").onclick = updateUser;
    document.getElementById("btnDeleteUser").onclick = deleteUser;

    document.getElementById("btnReloadVeiculos").onclick = loadVeiculos;
    document.getElementById("btnModoCriar").onclick = modoCriar;
    document.getElementById("btnSalvarVeiculo").onclick = salvarVeiculo;
    document.getElementById("btnCancelarVeiculo").onclick = () => {
    document.getElementById("formVeiculo").classList.add("hidden");
    };

    /* NOVO → LISTAR USUÁRIOS */
    
    loadVeiculos();
   
}

/* =============== USUÁRIO =============== */
async function updateUser() {
    const body = {
        name: document.getElementById("editName").value.trim(),
        email: document.getElementById("editEmail").value.trim()
    };

    if (!body.name || !body.email) return alert("Preencha tudo.");

    try {
        const resp = await fetch(`${API_USERS}/${userLogged.id}`, {
            method: "PUT",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(body)
        });

        const updated = await resp.json();
        sessionStorage.setItem("userLogged", JSON.stringify(updated));
        userLogged = updated;

        alert("Usuário atualizado.");
    } catch (err) {
        console.error(err);
        alert("Erro ao atualizar.");
    }
}

async function deleteUser() {
    if (!confirm("Excluir conta?")) return;

    try {
        await fetch(`${API_USERS}/${userLogged.id}`, { method: "DELETE" });
        sessionStorage.removeItem("userLogged");
        alert("Conta excluída.");
        window.location.href = "index.html";
    } catch (e) {
        alert("Erro ao excluir.");
    }
}



/* =============== VEÍCULOS =============== */
async function loadVeiculos() {
    const container = document.getElementById("veiculos");
    container.innerHTML = "Carregando...";

    try {
        const resp = await fetch(API_VEICULOS);
        const lista = await resp.json();

        container.innerHTML = "";

        if (lista.length === 0) {
            container.innerHTML = "<p>Nenhum veículo encontrado.</p>";
            return;
        }

        lista.forEach(v => {
            const id = v.id ?? v.codigo ?? "";

            const div = document.createElement("div");
            div.className = "veiculo-item";
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${escapeHtml(v.marca)} - ${escapeHtml(v.modelo)}</strong><br>
                        <small>Ano: ${v.ano} • Placa: ${escapeHtml(v.placa)}</small>
                    </div>

                    <div style="display:flex; gap:8px;">
                        <button onclick="editarVeiculo('${id}')">Editar</button>
                        <button onclick="reservar('${id}')" ${v.status !== "DISPONIVEL" ? "disabled" : ""}>Reservar</button>
                        <button onclick="pagar('${id}')" ${v.status !== "DISPONIVEL" ? "disabled" : ""}>Pagar</button>
                        <button class="danger" onclick="deletarVeiculo('${id}')">Excluir</button>
                    </div>
                </div>

                <div style="margin-top:8px;">
                    Status: ${v.status} • Preço: R$ ${v.preco}
                </div>
            `;

            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "Erro ao carregar veículos.";
    }
}

function modoCriar() {
    editandoVeiculoId = null;
    document.getElementById("formTitle").textContent = "Novo Veículo";

    document.getElementById("formVeiculo").classList.remove("hidden");
    document.getElementById("vModelo").value = "";
    document.getElementById("vMarca").value = "";
    document.getElementById("vAno").value = "";
    document.getElementById("vPlaca").value = "";
    document.getElementById("vPreco").value = "";
    document.getElementById("vStatus").value = "DISPONIVEL";
}

async function editarVeiculo(id) {
    try {
        const resp = await fetch(`${API_VEICULOS}/${id}`);
        const v = await resp.json();

        editandoVeiculoId = id;

        document.getElementById("vModelo").value = v.modelo;
        document.getElementById("vMarca").value = v.marca;
        document.getElementById("vAno").value = v.ano;
        document.getElementById("vPlaca").value = v.placa;
        document.getElementById("vPreco").value = v.preco;
        document.getElementById("vStatus").value = v.status;

        document.getElementById("formTitle").textContent = "Editar Veículo";
        document.getElementById("formVeiculo").classList.remove("hidden");

    } catch (err) {
        alert("Erro ao carregar veículo.");
    }
}

async function salvarVeiculo() {
    const body = {
        modelo: document.getElementById("vModelo").value.trim(),
        marca: document.getElementById("vMarca").value.trim(),
        ano: Number(document.getElementById("vAno").value),
        placa: document.getElementById("vPlaca").value.trim(),
        preco: Number(document.getElementById("vPreco").value),
        status: document.getElementById("vStatus").value
    };

    if (!body.modelo || !body.marca || !body.placa)
        return alert("Preencha modelo, marca e placa.");

    try {
        const method = editandoVeiculoId ? "PUT" : "POST";
        const url = editandoVeiculoId
            ? `${API_VEICULOS}/${editandoVeiculoId}`
            : API_VEICULOS;

        await fetch(url, {
            method,
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(body)
        });

        alert("Veículo salvo.");
        document.getElementById("formVeiculo").classList.add("hidden");
        loadVeiculos();

    } catch (err) {
        alert("Erro ao salvar.");
    }
}

async function deletarVeiculo(id) {
    if (!confirm("Excluir veículo?")) return;

    try {
        await fetch(`${API_VEICULOS}/${id}`, { method: "DELETE" });
        alert("Veículo excluído.");
        loadVeiculos();
    } catch (e) {
        alert("Erro ao excluir.");
    }
}

/* placeholders */
function reservar(id){ alert("Reserva (placeholder) id=" + id); }
function pagar(id){ alert("Pagamento (placeholder) id=" + id); }
