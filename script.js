// --- CONFIGURAÇÃO DAS APIs ---
const API_USERS = "https://userservice-u3s8.onrender.com/users";
const API_VEICULOS = "https://ms-veiculos.onrender.com/api/veiculos";
const API_RESERVAS = "https://reserva-service-dijf.onrender.com/reservas";
const API_PAGAMENTOS = "https://microservicepagamento.onrender.com/pagamentos";

let userLogged = null;
let editandoVeiculoId = null;
let veiculoParaReservarId = null; // Guarda o ID do carro para reserva
let reservaParaPagar = null;      // Guarda o objeto reserva para pagamento

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
    document.getElementById("btnReloadReservas").onclick = loadReservas;
    document.getElementById("btnSearchReserva").onclick = searchReservaHandler;

    // Logout
    document.getElementById("btnLogout").onclick = () => {
        sessionStorage.removeItem("userLogged");
        window.location.href = "index.html";
    };

    // User Actions
    document.getElementById("btnUpdateUser").onclick = updateUser;
    document.getElementById("btnDeleteUser").onclick = deleteUser;

    // Veículos Actions
    document.getElementById("btnReloadVeiculos").onclick = loadVeiculos;
    document.getElementById("btnModoCriar").onclick = modoCriar;
    document.getElementById("btnSalvarVeiculo").onclick = salvarVeiculo;
    document.getElementById("btnCancelarVeiculo").onclick = () => {
        document.getElementById("formVeiculo").classList.add("hidden");
    };

    // Reservas Actions
    document.getElementById("btnReloadReservas").onclick = loadReservas;
    document.getElementById("btnConfirmarReserva").onclick = confirmarReservaHandler;
    document.getElementById("btnCancelarReserva").onclick = () => {
        document.getElementById("formReserva").classList.add("hidden");
        veiculoParaReservarId = null;
    };

    // Carregamento inicial
    loadVeiculos();
    loadReservas();
}

/* =============== PESQUISA DE RESERVAS (CORRIGIDO) =============== */
async function searchReservaHandler() {
    const termo = document.getElementById("searchReservaId").value.trim();
    const container = document.getElementById("reservas-list");

    // 1. Se estiver vazio, recarrega tudo e para
    if (!termo) {
        loadReservas();
        return;
    }

    // 2. Verificação de segurança do usuário
    if (!userLogged || !userLogged.id) {
        alert("Erro: Você precisa estar logado para buscar.");
        return;
    }

    container.innerHTML = "Buscando...";

    try {
        // Busca todas as reservas
        const resp = await fetch(API_RESERVAS);
        
        if (!resp.ok) throw new Error(`Erro na API: ${resp.status}`);
        
        const todas = await resp.json();
        
        console.log("Total recebido:", todas.length); // Debug

        // 3. Filtro Robusto
        const filtradas = todas.filter(r => {
            // Converte tudo para String para garantir a comparação
            const idReserva = String(r.id);
            const idClienteReserva = String(r.clienteId);
            const idUsuarioLogado = String(userLogged.id);

            // Verifica se o ID bate E se a reserva pertence ao usuário logado
            return idReserva === termo && idClienteReserva === idUsuarioLogado;
        });

        console.log("Encontradas:", filtradas); // Debug

        // 4. Renderiza
        renderizarListaReservas(filtradas, container);

    } catch (err) {
        console.error("ERRO DETALHADO DA BUSCA:", err); // <--- OLHE O CONSOLE F12 SE O ERRO PERSISTIR
        container.innerHTML = `<p style="color:red">Erro ao buscar: ${err.message}</p>`;
    }
}

function renderizarListaReservas(lista, container) {
    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhuma reserva encontrada.</p>";
        return;
    }

    lista.forEach(r => {
        const div = document.createElement("div");
        div.className = "veiculo-item";
        
        let corStatus = "gray";
        if(r.status === 'PENDENTE') corStatus = "orange";
        if(r.status === 'CONFIRMADA') corStatus = "green";
        if(r.status === 'CANCELADA') corStatus = "red";
        
        div.style.borderLeft = `5px solid ${corStatus}`;
        
        const dtInicio = new Date(r.dataInicio).toLocaleString('pt-BR');
        const dtFim = new Date(r.dataFim).toLocaleString('pt-BR');
        const valor = r.valorTotalEstimado 
            ? r.valorTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : "R$ --";

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>Reserva #${r.id}</strong> <span style="font-size:0.8em; color:#666;">(Carro ID: ${r.categoriaCarroId})</span><br>
                    <small>Retirada: ${dtInicio}</small><br>
                    <small>Devolução: ${dtFim}</small>
                </div>

                <div style="text-align:right;">
                    <div style="font-weight:bold; margin-bottom:5px;">${valor}</div>
                    <span style="padding:4px 8px; border-radius:4px; font-size:0.8em; background:#eee; font-weight:bold;">${r.status}</span>
                </div>
            </div>

            <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:5px;">
                ${r.status === 'PENDENTE' ? 
                    `<button onclick="pagarReservaDireta(${r.id}, ${r.valorTotalEstimado}, ${r.categoriaCarroId})" style="background-color:green; color:white;">Pagar Agora</button>` 
                    : ''}
                
                ${r.status !== 'CANCELADA' && r.status !== 'CONCLUIDA' ? 
                    `<button onclick="cancelarReserva(${r.id})" class="danger">Cancelar</button>` 
                    : ''}
            </div>
        `;

        container.appendChild(div);
    });
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

        // Ordena para mostrar disponíveis primeiro
        lista.sort((a, b) => (a.status === 'DISPONIVEL' ? -1 : 1));

        lista.forEach(v => {
            const id = v.id ?? v.codigo ?? "";
            const disponivel = v.status === "DISPONIVEL" || v.status === "disponível";

            const div = document.createElement("div");
            div.className = "veiculo-item";
            // Estilo visual simples para status
            div.style.borderLeft = disponivel ? "4px solid green" : "4px solid gray";

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${escapeHtml(v.marca)} - ${escapeHtml(v.modelo)}</strong><br>
                        <small>Ano: ${v.ano} • Placa: ${escapeHtml(v.placa)}</small>
                    </div>

                    <div style="display:flex; gap:8px;">
                        <button onclick="editarVeiculo('${id}')">Editar</button>
                        
                        <button onclick="abrirModalReserva('${id}')" 
                            style="${disponivel ? 'background-color:#4CAF50;color:white;' : 'background-color:#ccc;cursor:not-allowed;'}"
                            ${!disponivel ? "disabled" : ""}>
                            ${disponivel ? "Reservar" : "Indisponível"}
                        </button>

                        <button class="danger" onclick="deletarVeiculo('${id}')">Excluir</button>
                    </div>
                </div>

                <div style="margin-top:8px;">
                    Status: <strong>${v.status}</strong> • Diária: R$ ${v.preco}
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

/* =============== RESERVAS (Lógica e Listagem) =============== */

// Lista as reservas do usuário logado
async function loadReservas() {
    const container = document.getElementById("reservas-list");
    container.innerHTML = "Carregando...";

    if (!userLogged || !userLogged.id) return;

    try {
        const resp = await fetch(API_RESERVAS);
        if (!resp.ok) throw new Error("Erro ao buscar reservas");
        
        const todasReservas = await resp.json();

        // Filtro por usuário (ID convertido para string para garantir)
        const minhasReservas = todasReservas.filter(r => String(r.clienteId) === String(userLogged.id));

        container.innerHTML = "";

        if (minhasReservas.length === 0) {
            container.innerHTML = "<p>Você não possui reservas.</p>";
            return;
        }

        // Ordena: PENDENTE primeiro, depois as mais recentes (ID maior)
        minhasReservas.sort((a, b) => {
            if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
            if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
            return b.id - a.id;
        });

        minhasReservas.forEach(r => {
            const div = document.createElement("div");
            div.className = "veiculo-item"; // Reusa CSS
            
            // Cores da borda lateral conforme status
            let corStatus = "gray";
            if(r.status === 'PENDENTE') corStatus = "orange";
            if(r.status === 'CONFIRMADA') corStatus = "green";
            if(r.status === 'CANCELADA') corStatus = "red";
            
            div.style.borderLeft = `5px solid ${corStatus}`;
            
            // Formatar datas e valores
            const dtInicio = new Date(r.dataInicio).toLocaleString('pt-BR');
            const dtFim = new Date(r.dataFim).toLocaleString('pt-BR');
            const valor = r.valorTotalEstimado 
                ? r.valorTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : "R$ --";

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>Reserva #${r.id}</strong> <span style="font-size:0.8em; color:#666;">(Carro ID: ${r.categoriaCarroId})</span><br>
                        <small>Retirada: ${dtInicio}</small><br>
                        <small>Devolução: ${dtFim}</small>
                    </div>

                    <div style="text-align:right;">
                        <div style="font-weight:bold; margin-bottom:5px;">${valor}</div>
                        <span style="padding:4px 8px; border-radius:4px; font-size:0.8em; background:#eee; font-weight:bold;">${r.status}</span>
                    </div>
                </div>

                <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:5px;">
                    ${r.status === 'PENDENTE' ? 
                        `<button onclick="pagarReservaDireta(${r.id}, ${r.valorTotalEstimado}, ${r.categoriaCarroId})" style="background-color:green; color:white;">Pagar Agora</button>` 
                        : ''}
                    
                    ${r.status !== 'CANCELADA' && r.status !== 'CONCLUIDA' ? 
                        `<button onclick="cancelarReserva(${r.id})" class="danger">Cancelar</button>` 
                        : ''}
                </div>
            `;

            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "Erro ao carregar lista de reservas.";
    }
}

// Abre o Modal de Reserva
async function abrirModalReserva(id) {
    try {
        const resp = await fetch(`${API_VEICULOS}/${id}`);
        const veiculo = await resp.json();
        
        veiculoParaReservarId = id;
        document.getElementById("reservaVeiculoNome").textContent = `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})`;
        
        // Limpa campos
        document.getElementById("resDataInicio").value = "";
        document.getElementById("resDataFim").value = "";

        document.getElementById("formReserva").classList.remove("hidden");
        document.getElementById("formReserva").scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        alert("Erro ao carregar dados do veículo.");
        console.error(err);
    }
}

// Envia a Reserva para o Backend
async function confirmarReservaHandler() {
    if (!userLogged || !userLogged.id) return alert("Erro: Usuário não identificado.");
    if (!veiculoParaReservarId) return alert("Erro: Nenhum veículo selecionado.");

    const inicio = document.getElementById("resDataInicio").value;
    const fim = document.getElementById("resDataFim").value;

    if (!inicio || !fim) return alert("Selecione as datas.");

    const payload = {
        clienteId: String(userLogged.id), // Garante envio como String
        categoriaCarroId: Number(veiculoParaReservarId),
        dataInicio: inicio + ":00", // Formato ISO para LocalDateTime
        dataFim: fim + ":00"
    };

    console.log("Enviando Reserva:", payload);

    try {
        const resp = await fetch(API_RESERVAS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            const errorText = await resp.text(); 
            throw new Error(errorText || "Erro ao criar reserva");
        }

        const reservaCriada = await resp.json();
        const valorFmt = reservaCriada.valorTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        alert(`Reserva criada!\nStatus: ${reservaCriada.status}\nValor: ${valorFmt}`);

        document.getElementById("formReserva").classList.add("hidden");
        
        // Atualiza ambas as listas
        loadVeiculos();
        loadReservas();

    } catch (err) {
        console.error(err);
        alert("Falha na reserva: " + err.message);
    }
}

// Cancela uma reserva
// Cancela uma reserva
async function cancelarReserva(id) {
    if(!confirm(`Tem certeza que deseja cancelar a reserva #${id}?`)) return;
    
    try {
        const resp = await fetch(`${API_RESERVAS}/${id}/status`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ status: "CANCELADA" }) // Certifique-se que é maiúsculo igual ao Enum Java
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(errText || "Erro ao cancelar no servidor.");
        }

        alert("Reserva cancelada com sucesso.");
        
        // Atualiza as listas para refletir a mudança de status e cor
        loadReservas();
        loadVeiculos(); 

    } catch(e) {
        console.error(e);
        alert("Erro ao cancelar: " + e.message);
    }
}

/* ================= PAGAMENTOS ================= */

// Função chamada pelo botão "Pagar Agora" na lista de reservas
function pagarReservaDireta(idReserva, valor, idCarro) {
    // Cria objeto temporário
    const reservaMock = {
        id: idReserva,
        valorTotalEstimado: valor,
        clienteId: userLogged.id,
        categoriaCarroId: idCarro
    };
    
    reservaParaPagar = reservaMock; 
    
    // Inicia fluxo
    const metodo = prompt(`Pagar ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}?\n\nDigite o método: PIX, CARTAO_DEBITO ou CARTAO_CREDITO`);
    
    if(!metodo) return;

    const metodoUpper = metodo.trim().toUpperCase();
    if (!["PIX", "CARTAO_CREDITO", "CARTAO_DEBITO"].includes(metodoUpper)) {
        return alert("Método inválido.");
    }

    processarPagamento(reservaParaPagar, valor, metodoUpper);
}

// Chama o MS de Pagamentos
async function processarPagamento(reserva, valor, metodoPagamento) {
    const bodyPagamento = {
        clienteId: String(reserva.clienteId), 
        valor: valor,
        metodoPagamento: metodoPagamento,
        descricao: `Reserva #${reserva.id}` 
    };

    try {
        const respPag = await fetch(API_PAGAMENTOS, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(bodyPagamento)
        });

        if (!respPag.ok) {
            const erroTxt = await respPag.text();
            throw new Error(`Erro no MS Pagamento: ${erroTxt}`);
        }

        const pagCriado = await respPag.json();
        console.log("Pagamento criado:", pagCriado);

        // Atualiza status da reserva para CONFIRMADA
        await fetch(`${API_RESERVAS}/${reserva.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CONFIRMADA" })
        });

        alert(`Pagamento Confirmado! (ID: ${pagCriado.id})`);
        
        loadReservas();
        loadVeiculos();

    } catch (err) {
        console.error("Falha no pagamento:", err);
        alert(`Falha: ${err.message}`);
    }
}