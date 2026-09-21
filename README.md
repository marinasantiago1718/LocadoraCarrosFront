#  Locadora de Carros — Front-end

Interface web desenvolvida para **testar e integrar microsserviços de uma aplicação de simulação de locação de veículos**.

O projeto funciona como uma camada de interface para validar a comunicação entre diferentes serviços independentes, permitindo realizar operações relacionadas a **usuários, veículos, reservas e pagamentos**.

##  Objetivo

O front-end foi desenvolvido principalmente como uma **ferramenta de integração e testes dos microsserviços** do projeto de locadora de carros.

A aplicação permite visualizar e executar, por meio de uma interface web, operações disponibilizadas pelos seguintes serviços:

* 👤 Microsserviço de Usuários
* 🚗 Microsserviço de Veículos
* 📅 Microsserviço de Reservas
* 💳 Microsserviço de Pagamentos

As requisições são realizadas diretamente para as APIs dos respectivos microsserviços.

##  Funcionalidades

### 👤 Usuários

* Cadastro de usuário
* Login
* Edição de dados do usuário
* Exclusão de conta
* Logout

O usuário autenticado é armazenado temporariamente no `sessionStorage` para manter a sessão durante a utilização da aplicação.

### 🚗 Veículos

* Listagem de veículos
* Cadastro de veículos
* Edição de veículos
* Exclusão de veículos
* Visualização de status e preço
* Seleção de veículo para uma nova reserva

Os veículos são apresentados de acordo com seu status de disponibilidade.

### 📅 Reservas

* Criação de reservas
* Visualização das reservas do usuário
* Busca de reserva por ID
* Cancelamento de reservas
* Conclusão de reservas e devolução do veículo
* Visualização de período, valor e status da reserva

As reservas são associadas ao usuário autenticado e ao veículo selecionado.

### 💳 Pagamentos

* Seleção do método de pagamento
* Envio do pagamento ao microsserviço correspondente
* Atualização do status do pagamento
* Confirmação da reserva após o pagamento

São considerados os métodos **PIX, cartão de crédito e cartão de débito**.

## 🔗 Integração com microsserviços

O front-end realiza requisições HTTP independentes para cada microsserviço:

```text
                 ┌──────────────────────┐
                 │      Front-end       │
                 │  LocadoraCarrosFront │
                 └──────────┬───────────┘
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │   Usuários  │ │   Veículos  │ │   Reservas  │
     │ Microservice│ │ Microservice│ │ Microservice│
     └─────────────┘ └─────────────┘ └──────┬──────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │ Pagamentos  │
                                     │ Microservice│
                                     └─────────────┘
```

A comunicação é feita utilizando requisições HTTP, principalmente pelos métodos `GET`, `POST`, `PUT`, `PATCH` e `DELETE`.

## Tecnologias utilizadas

* **HTML5**
* **CSS3**
* **JavaScript**
* **APIs REST**
* **HTTP / JSON**
* **Git e GitHub**

A interface é composta por páginas HTML, estilização em CSS e lógica de integração implementada em JavaScript.

## 📁 Estrutura do projeto

```text
LocadoraCarrosFront/
├── index.html
├── app.html
├── script.js
├── styles.css
└── README.md
```

* **`index.html`** — página de login e cadastro.
* **`app.html`** — interface principal da aplicação.
* **`script.js`** — lógica da aplicação e comunicação com os microsserviços.
* **`styles.css`** — estilos e organização visual da interface.

## Contexto acadêmico

Este projeto foi desenvolvido como parte de um trabalho prático envolvendo **arquitetura de microsserviços**, com o front-end utilizado para validar a comunicação e o funcionamento conjunto dos serviços.

O foco do projeto não está na construção de um front-end complexo, mas na utilização de uma interface para **testar, integrar e demonstrar o funcionamento dos microsserviços de usuários, veículos, reservas e pagamentos**.

## 👩‍💻 Autora

**Marina Santiago**

[GitHub](https://github.com/marinasantiago1718)
