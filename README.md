# Controle Financeiro

Aplicacao web para registrar renda, acompanhar gastos mensais e separar valores no cofre para objetivos e reserva. O foco do projeto e transformar a rotina de controle financeiro em algo visual, rapido e simples de manter no dia a dia.

## Como este projeto me ajuda a controlar os gastos

- registro a renda do mes para saber o teto real disponivel
- adiciono cada gasto com categoria e data para nao perder o controle
- acompanho o saldo final depois das despesas e depois do valor guardado no cofre
- comparo meses anteriores para entender onde estou gastando mais
- separo dinheiro para metas, emergencias e planos futuros sem misturar com o restante

## Principais funcionalidades

- dashboard com resumo do mes, saldo final e visualizacao por categoria
- cadastro de renda mensal com reaproveitamento da ultima renda registrada
- lancamento e exclusao de gastos
- gerenciamento de categorias personalizadas
- cofre para guardar valores por objetivo e prioridade
- historico de gastos e comparacao entre meses

## Tecnologias

- Front-end: HTML, CSS e JavaScript puro
- Back-end: Node.js com Express
- Banco local: SQLite
- Graficos: Chart.js


## Estrutura publica do projeto

```text
.
|-- server.js
|-- package.json
|-- public/
|   |-- index.html
|   |-- style.css
|   `-- script.js
`-- docs/
    `-- screenshots/
```


## Como executar localmente

```bash
npm install
npm start
```

Depois, abra `http://localhost:3000`.

## API principal

- `POST /api/income`
- `GET /api/income/:month`
- `POST /api/expenses`
- `GET /api/expenses`
- `GET /api/expenses/:month`
- `DELETE /api/expenses/:id`
- `GET /api/categories`
- `POST /api/categories`
- `DELETE /api/categories/:id`
- `POST /api/piggy-bank`
- `GET /api/piggy-bank`
- `GET /api/piggy-bank/summary/:month`
- `GET /api/monthly-summary/:month`
- `GET /api/summary/:month`
- `GET /api/comparison`

## Observacoes

- o banco SQLite e criado localmente e nao deve ser publicado
- o projeto pode evoluir depois para variaveis de ambiente e banco externo sem expor dados pessoais
