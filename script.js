const API_USERS = "https://userservice-u3s8.onrender.com/users";
const API_VEICULOS = "https://ms-veiculos.onrender.com/api/veiculos";
const API_RESERVAS = "https://reserva-service-dijf.onrender.com/reservas";
const API_PAGAMENTOS = "https://microservicepagamento.onrender.com/pagamentos";

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

    document.getElementById("btnCancelarVeiculo").onclick = () => {
        document.getElementById("formVeiculo").classList.add("hidden");
    };

    document.getElementById("btnConfirmarReserva").onclick = confirmarReservaHandler;
    document.getElementById("btnCancelarReserva").onclick = () => {
        document.getElementById("formReserva").classList.add("hidden");
        veiculoParaReservarId = null; // Limpa variável temporária
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

/* =============== RESERVAS =============== */
let veiculoParaReservarId = null;

async function reservar(id) {
    try {
        const resp = await fetch(`${API_VEICULOS}/${id}`);
        const veiculo = await resp.json();
        
        veiculoParaReservarId = id;
        document.getElementById("reservaVeiculoNome").textContent = `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})`;
        
        document.getElementById("resDataInicio").value = "";
        document.getElementById("resDataFim").value = "";

        document.getElementById("formReserva").classList.remove("hidden");

        document.getElementById("formReserva").scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        alert("Erro ao carregar dados do veículo para reserva.");
        console.error(err);
    }
}

// Função chamada ao clicar em "Confirmar Reserva"
async function confirmarReservaHandler() {
    if (!userLogged || !userLogged.id) return alert("Erro: Usuário não identificado.");
    if (!veiculoParaReservarId) return alert("Erro: Nenhum veículo selecionado.");

    const inicio = document.getElementById("resDataInicio").value;
    const fim = document.getElementById("resDataFim").value;

    if (!inicio || !fim) return alert("Selecione as datas de retirada e devolução.");

    // O backend espera LocalDateTime (ISO 8601). O input datetime-local gera algo como "2023-12-01T10:00"
    // Vamos garantir que esteja no formato correto (adicionando segundos se necessário)
    
    const payload = {
        clienteId: userLogged.id, // ID do usuário logado
        categoriaCarroId: Number(veiculoParaReservarId), // ID do veículo
        dataInicio: inicio + ":00", // Adiciona segundos para compatibilidade com Java LocalDateTime
        dataFim: fim + ":00"
    };

    try {
        const resp = await fetch(API_RESERVAS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            // Tenta pegar a mensagem de erro do backend (ex: "Carro indisponível")
            const errorText = await resp.text(); 
            throw new Error(errorText || "Erro ao criar reserva");
        }

        const reservaCriada = await resp.json();

        // Formata o valor para moeda
        const valorFormatado = reservaCriada.valorTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        alert(`Reserva confirmada com sucesso!\n\nStatus: ${reservaCriada.status}\nValor Estimado: ${valorFormatado}`);

        // Esconde o formulário
        document.getElementById("formReserva").classList.add("hidden");
        
        // RECARREGA A LISTA DE VEÍCULOS
        // Isso é crucial: o status do carro mudou para "ALUGADO" no backend,
        // precisamos atualizar a tela para bloquear o botão "Reservar" desse carro.
        loadVeiculos();

    } catch (err) {
        console.error(err);
        alert("Falha na reserva: " + err.message);
    }
}

/* ================= INTEGRAÇÃO PAGAMENTOS ================= */

// Função temporária para simular reserva, pois não temos o endpoint de reserva no pagamento MS
async function reservar(veiculoId) {
    if (!confirm(`Confirmar reserva para o veículo ID ${veiculoId}?`)) return;
    
    // NOTA: Idealmente, esta chamada iria para o MS de Veículos para alterar o status para RESERVADO
    // Por enquanto, apenas um placeholder para feedback
    alert(`Veículo ${veiculoId} reservado (Ação Placeholder).`);
    loadVeiculos();
}

// -------------------------------------------------------------
// FUNÇÃO PRINCIPAL DE PAGAMENTO
// -------------------------------------------------------------
async function pagar(veiculo) {
    // 1. Encontrar o veículo no MS Veículos para obter o preço e detalhes
    try {
        const respVeiculo = await fetch(`${API_VEICULOS}/${veiculo}`);
        if (!respVeiculo.ok) throw new Error("Veículo não encontrado.");
        
        const v = await respVeiculo.json();
        
        const valor = v.preco; // Usa o preço do veículo
        
        // 2. Abrir um prompt para confirmação e método
        const metodo = prompt(`Confirmar pagamento de R$ ${valor.toFixed(2)} para o veículo ${v.modelo} (${v.marca})? Digite o método de pagamento (PIX, BOLETO, CARTAO_CREDITO):`);

        if (!metodo) return; // Cancelado
        
        const metodoUpper = metodo.trim().toUpperCase();
        
        // 3. Validação básica do método (baseado no seu Enum)
        if (!["PIX", "BOLETO", "CARTAO_CREDITO", "CARTAO_DEBITO"].includes(metodoUpper)) {
            return alert("Método de pagamento inválido. Use PIX, BOLETO, ou CARTAO_CREDITO.");
        }
        
        await confirmarPagamento(userLogged.id, valor, metodoUpper);

    } catch (err) {
        console.error("Erro ao iniciar pagamento:", err);
        alert("Erro ao preparar pagamento. Verifique o console.");
    }
}

// -------------------------------------------------------------
// FUNÇÃO QUE CHAMA O MICROSERVICE DE PAGAMENTOS (POST)
// -------------------------------------------------------------
async function confirmarPagamento(clienteId, valor, metodoPagamento) {
    const body = {
        clienteId: Number(clienteId), // O userLogged.id é o clienteId
        valor: Number(valor),
        metodoPagamento: metodoPagamento // PIX, BOLETO, etc.
        // Se houver 'descricao' no seu DTO, adicione aqui
    };

    try {
        const resp = await fetch(API_PAGAMENTOS, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            // Se o status não for 2xx, tenta ler a mensagem de erro do backend
            const errorText = await resp.text();
            throw new Error(`Falha no pagamento (HTTP ${resp.status}): ${errorText}`);
        }

        const pagamentoResponse = await resp.json();
        
        // Sucesso: O pagamento foi criado no status PROCESSANDO
        alert(`Pagamento criado com sucesso! ID: ${pagamentoResponse.id}. Status: ${pagamentoResponse.status}.`);

        // Idealmente, aqui você chamaria um PATCH/PUT no MS Veículos para mudar o status para 'RESERVADO' ou 'PAGO'

    } catch (err) {
        console.error("Erro na API de Pagamentos:", err);
        alert(`Falha ao processar pagamento. ${err.message}`);
    }
}
