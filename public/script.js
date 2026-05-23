// ===== VARIÁVEIS GLOBAIS =====
let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
let categories = [];
let categoryChart = null;
let comparisonChart = null;
let monthlyOverviewChart = null;

// ===== NOTIFICAÇÕES TOAST =====
function showToast(message, type = 'success') {
  // Remover toast existente se houver
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Criar elemento toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Ícone conforme o tipo
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  // Adicionar ao body
  document.body.appendChild(toast);

  // Animar entrada
  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 10);

  // Remover após 3 segundos
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ===== MODAL DE CONFIRMAÇÃO =====
function showConfirmModal(message, onConfirm) {
  // Remover modal existente se houver
  const existingModal = document.querySelector('.confirm-modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }

  // Criar overlay
  const overlay = document.createElement('div');
  overlay.className = 'confirm-modal-overlay';

  // Criar modal
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';

  modal.innerHTML = `
    <div class="confirm-modal-icon">⚠️</div>
    <div class="confirm-modal-message">${message}</div>
    <div class="confirm-modal-buttons">
      <button class="btn-cancel" id="confirm-cancel">Cancelar</button>
      <button class="btn-confirm" id="confirm-ok">Confirmar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Event listeners
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('confirm-ok').addEventListener('click', () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  });

  // Fechar ao clicar fora
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// ===== TEMA ESCURO/CLARO =====
function initializeTheme() {
  console.log('Inicializando tema...');
  const savedTheme = localStorage.getItem('theme') || 'light';
  console.log('Tema salvo:', savedTheme);
  setTheme(savedTheme);
}

function setTheme(theme) {
  console.log('Aplicando tema:', theme);
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  const toggleBtn = document.getElementById('theme-toggle');
  console.log('Botão encontrado:', toggleBtn);
  if (toggleBtn) {
    toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    console.log('Botão de tema atualizado para:', theme === 'dark' ? '☀️' : '🌙');
  }
}

function toggleTheme() {
  console.log('Toggle de tema chamado');
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  console.log('Tema atual:', currentTheme);
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  console.log('Novo tema:', newTheme);
  setTheme(newTheme);
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired - inicializando aplicação...');

  console.log('Chamando initializeTheme...');
  initializeTheme();

  console.log('Chamando initializeDateInputs...');
  initializeDateInputs();

  console.log('Chamando setupEventListeners...');
  setupEventListeners();

  console.log('Carregando dados...');
  loadCategories();
  checkAndCopyIncome();
  loadDashboard();
  loadAllExpenses();
  loadComparison();
  loadPiggyBank();

  console.log('Aplicação inicializada com sucesso!');
});

function initializeDateInputs() {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const expenseDate = document.getElementById('expense-date');
  if (expenseDate) {
    expenseDate.valueAsDate = today;
  }

  const currentMonthInput = document.getElementById('current-month');
  if (currentMonthInput) {
    currentMonthInput.value = currentMonth;
  }

  const budgetMonthInput = document.getElementById('budget-month');
  if (budgetMonthInput) {
    budgetMonthInput.value = currentMonth;
  }

  const incomeMonthInput = document.getElementById('income-month');
  if (incomeMonthInput) {
    incomeMonthInput.value = currentMonth;
  }
}

function setupEventListeners() {
  console.log('Configurando event listeners...');

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  console.log('Botões de tab encontrados:', tabButtons.length);
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
      console.log('Tab clicada:', btn.dataset.tab);
      switchTab(btn.dataset.tab, event);
    });
  });

  // Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  console.log('Botão de tema encontrado:', themeToggle);
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      console.log('Botão de tema clicado');
      toggleTheme();
    });
    console.log('Event listener adicionado ao botão de tema');
  } else {
    console.error('Botão de tema NÃO encontrado!');
  }

  // Expense Form
  document.getElementById('expense-form').addEventListener('submit', addExpense);

  // Category Form
  document.getElementById('category-form').addEventListener('submit', createCategory);

  // Income Form
  document.getElementById('income-form').addEventListener('submit', setIncome);

  // Piggy Bank Form
  document.getElementById('piggy-form').addEventListener('submit', addToPiggyBank);

  // Month Navigation
  document.getElementById('prev-month').addEventListener('click', () => {
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    currentMonth = date.toISOString().slice(0, 7);
    document.getElementById('current-month').value = currentMonth;
    checkAndCopyIncome();
    loadDashboard();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() + 1);
    currentMonth = date.toISOString().slice(0, 7);
    document.getElementById('current-month').value = currentMonth;
    checkAndCopyIncome();
    loadDashboard();
  });

  document.getElementById('current-month').addEventListener('change', (e) => {
    currentMonth = e.target.value;
    checkAndCopyIncome();
    loadDashboard();
  });

  // History Filter
  document.getElementById('history-month').addEventListener('change', filterHistory);
  document.getElementById('clear-filter').addEventListener('click', () => {
    document.getElementById('history-month').value = '';
    loadAllExpenses();
  });

  // Botão Flutuante para Adicionar Gasto
  const fabButton = document.getElementById('fab-add-expense');
  if (fabButton) {
    fabButton.addEventListener('click', () => {
      console.log('FAB clicado - abrindo aba de adicionar gasto');
      switchTab('add-expense', null);
      // Focar no campo de descrição
      setTimeout(() => {
        const descriptionInput = document.getElementById('expense-description');
        if (descriptionInput) {
          descriptionInput.focus();
        }
      }, 100);
    });
  }
}

// ===== NAVEGAÇÃO DE ABAS =====
function switchTab(tabName, event) {
  console.log('Switching to tab:', tabName);
  if (!tabName) {
    console.log('Tab name is empty, returning');
    return;
  }

  // Desativar todas as abas
  console.log('Desativando todas as tabs...');
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Ativar aba selecionada
  console.log('Ativando tab:', tabName);
  const tab = document.getElementById(tabName);
  if (tab) {
    tab.classList.add('active');
    console.log('Tab ativada com sucesso:', tabName);
  } else {
    console.log('Tab NÃO encontrada:', tabName);
  }

  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
    console.log('Botão ativado');
  }
}

// ===== ADICIONAR GASTO =====
async function addExpense(e) {
  e.preventDefault();

  const description = document.getElementById('expense-description').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;

  if (!description || !amount || !category || !date) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, amount, category, date }),
    });

    if (response.ok) {
      showToast('Gasto adicionado com sucesso!');
      document.getElementById('expense-form').reset();
      initializeDateInputs();
      loadDashboard();
      loadAllExpenses();
      loadComparison();
    } else {
      alert('Erro ao adicionar gasto');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor');
  }
}

// ===== GERENCIAR COFRE (PIGGY BANK) =====

// Adicionar ao cofre
async function addToPiggyBank(e) {
  e.preventDefault();

  const name = document.getElementById('piggy-description').value.trim();
  const amount = parseFloat(document.getElementById('piggy-amount').value);
  const category = document.getElementById('piggy-category').value;
  const priority = document.getElementById('piggy-priority').value;

  if (!name || !amount || !category) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    const response = await fetch('/api/piggy-bank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        amount,
        category,
        month: currentMonth,  // NOVO: incluir o mês atual
        priority_level: priority,
        color: getCategoryColor(category)
      }),
    });

    if (response.ok) {
      showToast('Adicionado ao cofre com sucesso! 🏦');
      document.getElementById('piggy-form').reset();
      loadPiggyBank();
      loadDashboard();
    } else {
      alert('Erro ao adicionar ao cofre');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor');
  }
}

// Carregar dados do cofre
async function loadPiggyBank() {
  try {
    const response = await fetch('/api/piggy-bank');
    const items = await response.json();
    displayPiggyBankItems(items);

    // Buscar resumo do MÊSPECÍFICO, não global
    const summaryResponse = await fetch(`/api/piggy-bank/summary/${currentMonth}`);
    const summary = await summaryResponse.json();
    updatePiggyBankSummary(summary);
  } catch (error) {
    console.error('Erro ao carregar cofre:', error);
  }
}

// Exibir itens do cofre
function displayPiggyBankItems(items) {
  const container = document.getElementById('piggy-items');

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhuma economia registrada</p>';
    return;
  }

  container.innerHTML = items.map(item => {
    const priorityClass = `priority-${item.priority_level.toLowerCase()}`;
    return `
      <div class="piggy-item" style="border-left-color: ${item.color}">
        <div class="piggy-info">
          <div class="piggy-title">${item.name}</div>
          <div class="piggy-meta">
            <strong>${item.category}</strong>
          </div>
          <span class="piggy-priority ${priorityClass}">
            ${item.priority_level}
          </span>
        </div>
        <div class="piggy-amount">R$ ${item.amount.toFixed(2).replace('.', ',')}</div>
        <div class="piggy-actions">
          <button class="btn-withdraw" onclick="withdrawFromPiggyBank(${item.id})">Sacar</button>
        </div>
      </div>
    `;
  }).join('');
}

// Sacar do cofre
async function withdrawFromPiggyBank(id) {
  showConfirmModal('Tem certeza que deseja sacar do cofre?', async () => {
    try {
      const response = await fetch(`/api/piggy-bank/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Sacado do cofre com sucesso!');
        loadPiggyBank();
        loadDashboard();
      } else {
        showToast('Erro ao sacar do cofre', 'error');
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast('Erro ao conectar com o servidor', 'error');
    }
  });
}

// Atualizar resumo do cofre
function updatePiggyBankSummary(summary) {
  document.getElementById('total-saved').textContent = `R$ ${summary.total.toFixed(2).replace('.', ',')}`;
}

// Obter cor da categoria
function getCategoryColor(categoryName) {
  const cat = categories.find(c => c.name === categoryName);
  return cat ? cat.color : '#3498db';
}

// ===== DEFINIR RENDA =====
async function checkAndCopyIncome() {
  const incomeMonthInput = document.getElementById('income-month');
  const incomeValueInput = document.getElementById('income-value');
  const incomeSourceInput = document.getElementById('income-source');

  if (!incomeMonthInput || !incomeValueInput || !incomeSourceInput) {
    return;
  }

  incomeMonthInput.value = currentMonth;

  try {
    const response = await fetch(`/api/income/${currentMonth}`);
    const incomeData = await response.json();

    if (!response.ok) {
      throw new Error('Erro ao carregar renda');
    }

    if (incomeData) {
      incomeValueInput.value = incomeData.amount ?? '';
      incomeSourceInput.value = incomeData.source || 'SalÃ¡rio';
    } else {
      incomeValueInput.value = '';
      incomeSourceInput.value = 'SalÃ¡rio';
    }
  } catch (error) {
    console.error('Erro ao carregar renda do mÃªs:', error);
  }
}

async function setIncome(e) {
  e.preventDefault();

  const month = document.getElementById('income-month').value;
  const amount = parseFloat(document.getElementById('income-value').value);
  const source = document.getElementById('income-source').value;

  if (!month || !amount) {
    alert('Preencha os campos obrigatórios!');
    return;
  }

  try {
    const response = await fetch('/api/income', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month, amount, source }),
    });

    if (response.ok) {
      showToast('Renda registrada com sucesso!');
      loadComparison();
      document.getElementById('income-source').value = 'Salário';
      loadDashboard();
    } else {
      alert('Erro ao registrar renda');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor');
  }
}

// ===== DELETAR GASTO =====
async function deleteExpense(id) {
  showConfirmModal('Tem certeza que deseja deletar este gasto?', async () => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Gasto removido com sucesso!');
        loadDashboard();
        loadAllExpenses();
        loadComparison();
      } else {
        showToast('Erro ao deletar gasto', 'error');
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast('Erro ao conectar com o servidor', 'error');
    }
  });
}

// ===== CARREGAR DASHBOARD =====
async function loadDashboard() {
  try {
    // Buscar resumo completo do mês
    const summaryResponse = await fetch(`/api/monthly-summary/${currentMonth}`);
    const summary = await summaryResponse.json();

    // Buscar gastos do mês
    const expensesResponse = await fetch(`/api/expenses/${currentMonth}`);
    const expenses = await expensesResponse.json();

    // Buscar resumo por categoria
    const categoryResponse = await fetch(`/api/summary/${currentMonth}`);
    const categoryData = await categoryResponse.json();

    // Buscar resumo do cofre DO MÊS ESPECÍFICO (não global)
    const piggyResponse = await fetch(`/api/piggy-bank/summary/${currentMonth}`);
    const piggyData = await piggyResponse.json();

    // Buscar categorias
    const categoriesResponse = await fetch('/api/categories');
    const categoriesList = await categoriesResponse.json();

    // Atualizar valores
    const income = summary.income || 0;
    const totalSpent = summary.totalExpenses || 0;
    const balance = summary.balance || 0;
    const totalSaved = piggyData.total || 0;
    const realBalance = income - totalSpent - totalSaved;
    const savedPercentage = income > 0 ? (totalSaved / income) * 100 : 0;
    const spentPercentage = income > 0 ? (totalSpent / income) * 100 : 0;
    const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

    // Atualizar campos principais
    document.getElementById('total-income').textContent = `R$ ${income.toFixed(2).replace('.', ',')}`;
    document.getElementById('total-spent').textContent = `R$ ${totalSpent.toFixed(2).replace('.', ',')}`;
    document.getElementById('piggy-bank-total').textContent = `R$ ${totalSaved.toFixed(2).replace('.', ',')}`;
    document.getElementById('real-balance').textContent = `R$ ${realBalance.toFixed(2).replace('.', ',')}`;
    
    // Atualizar a porcentagem junto com o cofre
    const percentageEl = document.getElementById('saved-percentage');
    if (percentageEl) {
      percentageEl.textContent = `📈 ${savedPercentage.toFixed(1)}% da renda`;
    }

    // Atualizar campos adicionais
    const incomeSource = document.getElementById('dashboard-income-source');
    if (incomeSource) {
      incomeSource.textContent = summary.source ? `Fonte: ${summary.source}` : 'Sem renda registrada';
    }

    const spentPercentageEl = document.getElementById('spent-percentage');
    if (spentPercentageEl) {
      spentPercentageEl.textContent = `${spentPercentage.toFixed(1)}% da renda`;
    }

    const realBalanceStatus = document.getElementById('real-balance-status');
    if (realBalanceStatus) {
      if (realBalance < 0) {
        realBalanceStatus.textContent = '⚠️ Saldo negativo';
        realBalanceStatus.style.color = '#ef4444';
      } else {
        realBalanceStatus.textContent = 'Após cofre';
        realBalanceStatus.style.color = '#94a3b8';
      }
    }

    // Label do mês
    const monthLabel = document.getElementById('current-month-label');
    if (monthLabel) {
      const [year, month] = currentMonth.split('-');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      monthLabel.textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    // Total do gráfico
    const chartTotal = document.getElementById('chart-total');
    if (chartTotal) {
      chartTotal.textContent = `Total: R$ ${totalSpent.toFixed(2).replace('.', ',')}`;
    }

    // Quantidade de gastos na lista
    const expenseCountLabel = document.getElementById('expense-count-label');
    if (expenseCountLabel) {
      expenseCountLabel.textContent = `${expenses.length} gasto${expenses.length !== 1 ? 's' : ''}`;
    }

    // Atualizar cores baseado no saldo real
    const realBalanceCard = document.querySelector('.remaining-card');
    if (realBalance < 0 && realBalanceCard) {
      realBalanceCard.style.borderTopColor = '#ef4444';
      document.getElementById('real-balance').style.color = '#ef4444';
    } else if (realBalanceCard) {
      realBalanceCard.style.borderTopColor = '#8b5cf6';
      document.getElementById('real-balance').style.color = '#8b5cf6';
    }

    // Atualizar gráfico de categorias
    updateCategoryChart(categoryData.categories);

    // Listar gastos do mês
    displayMonthExpenses(expenses);
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

// ===== ATUALIZAR GRÁFICO DE CATEGORIAS =====
function updateCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart').getContext('2d');

  const labels = categories.map(c => c.category);
  const data = categories.map(c => c.total);

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#3498db',
          '#e74c3c',
          '#2ecc71',
          '#f39c12',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#c0392b',
        ],
        borderColor: '#fff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  });
}

// ===== EXIBIR GASTOS DO MÊS =====
function displayMonthExpenses(expenses) {
  const container = document.getElementById('month-expenses');

  if (expenses.length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhum gasto registrado neste mês</p>';
    return;
  }

  container.innerHTML = expenses.map(expense => `
    <div class="expense-item">
      <div class="expense-info">
        <div class="expense-description">${expense.description}</div>
        <div class="expense-meta">
          <strong>${expense.category}</strong> • ${formatDate(expense.date)}
        </div>
      </div>
      <div class="expense-amount">R$ ${expense.amount.toFixed(2).replace('.', ',')}</div>
      <div class="expense-actions">
        <button class="btn-delete" onclick="deleteExpense(${expense.id})">Deletar</button>
      </div>
    </div>
  `).join('');
}

// ===== CARREGAR TODOS OS GASTOS =====
async function loadAllExpenses() {
  try {
    const response = await fetch('/api/expenses');
    const expenses = await response.json();
    displayAllExpenses(expenses);
  } catch (error) {
    console.error('Erro ao carregar gastos:', error);
  }
}

// ===== FILTRAR HISTÓRICO =====
async function filterHistory() {
  const filterMonth = document.getElementById('history-month').value;

  if (!filterMonth) {
    loadAllExpenses();
    return;
  }

  try {
    const response = await fetch(`/api/expenses/${filterMonth}`);
    const expenses = await response.json();
    displayAllExpenses(expenses);
  } catch (error) {
    console.error('Erro ao filtrar:', error);
  }
}

// ===== EXIBIR TODOS OS GASTOS =====
function displayAllExpenses(expenses) {
  const container = document.getElementById('all-expenses');

  if (expenses.length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhum gasto registrado</p>';
    return;
  }

  // Agrupar por mês
  const grouped = {};
  expenses.forEach(expense => {
    const month = expense.month;
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(expense);
  });

  // Renderizar por mês
  let html = '';
  Object.keys(grouped).sort().reverse().forEach(month => {
    const monthName = new Date(month + '-01').toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
    });

    html += `<h4 style="margin-top: 20px; margin-bottom: 10px; color: #2c3e50;">${monthName}</h4>`;

    grouped[month].forEach(expense => {
      html += `
        <div class="expense-item">
          <div class="expense-info">
            <div class="expense-description">${expense.description}</div>
            <div class="expense-meta">
              <strong>${expense.category}</strong> • ${formatDate(expense.date)}
            </div>
          </div>
          <div class="expense-amount">R$ ${expense.amount.toFixed(2).replace('.', ',')}</div>
          <div class="expense-actions">
            <button class="btn-delete" onclick="deleteExpense(${expense.id})">Deletar</button>
          </div>
        </div>
      `;
    });
  });

  container.innerHTML = html;
}

// ===== CARREGAR COMPARAÇÃO =====
async function loadComparison() {
  try {
    const response = await fetch('/api/comparison');
    const data = await response.json();
    updateComparisonChart(data);
    updateMonthlyOverviewChart(data);
  } catch (error) {
    console.error('Erro ao carregar comparação:', error);
  }
}

// ===== ATUALIZAR GRÁFICO DE COMPARAÇÃO =====
function updateComparisonChart(data) {
  const ctx = document.getElementById('comparisonChart').getContext('2d');

  const labels = data.map(d => {
    return new Date(d.month + '-01').toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit',
    });
  }).reverse();

  const values = data.map(d => d.expenses ?? d.total ?? 0).reverse();

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  comparisonChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gastos Mensais',
        data: values,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#3498db',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2).replace('.', ',');
            },
          },
        },
      },
    },
  });
}

function updateMonthlyOverviewChart(data) {
  const canvas = document.getElementById('monthlyOverviewChart');
  const caption = document.getElementById('overview-chart-caption');

  if (!canvas) {
    return;
  }

  const recentData = [...data].reverse().slice(-6);
  const labels = recentData.map(item =>
    new Date(`${item.month}-01`).toLocaleDateString('pt-BR', { month: 'short' })
  );
  const incomeValues = recentData.map(item => item.income ?? 0);
  const expenseValues = recentData.map(item => item.expenses ?? item.total ?? 0);
  const computedStyle = getComputedStyle(document.documentElement);

  if (caption) {
    caption.textContent = recentData.length
      ? 'Comparativo visual dos ultimos 6 meses'
      : 'Cadastre renda e gastos para visualizar o comparativo';
  }

  if (monthlyOverviewChart) {
    monthlyOverviewChart.destroy();
  }

  monthlyOverviewChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeValues,
          backgroundColor: '#56c596',
          borderRadius: 6,
          barThickness: 18,
        },
        {
          label: 'Despesas',
          data: expenseValues,
          backgroundColor: '#e56767',
          borderRadius: 6,
          barThickness: 18,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            usePointStyle: true,
            pointStyle: 'rectRounded',
            boxWidth: 10,
            color: computedStyle.getPropertyValue('--text-secondary').trim(),
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: R$ ${Number(context.raw || 0).toFixed(2).replace('.', ',')}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: computedStyle.getPropertyValue('--text-muted').trim(),
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: computedStyle.getPropertyValue('--border-color').trim(),
            drawBorder: false,
          },
          ticks: {
            color: computedStyle.getPropertyValue('--text-muted').trim(),
            callback(value) {
              return `R$ ${Number(value).toLocaleString('pt-BR')}`;
            },
          },
        },
      },
    },
  });
}

// ===== GERENCIAR CATEGORIAS =====

// Carregar categorias
async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    categories = await response.json();
    populateCategorySelect();
    displayCategories();
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

// Popular select com categorias
function populateCategorySelect() {
  const select = document.getElementById('expense-category');
  select.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    select.appendChild(option);
  });

  // Popular também o select do piggy bank
  const piggySelect = document.getElementById('piggy-category');
  if (piggySelect) {
    piggySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name;
      option.textContent = cat.name;
      piggySelect.appendChild(option);
    });
  }
}

// Criar nova categoria
async function createCategory(e) {
  e.preventDefault();

  const name = document.getElementById('category-name').value.trim();
  const color = document.getElementById('category-color').value;

  if (!name) {
    alert('Digite o nome da categoria!');
    return;
  }

  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, color }),
    });

    const result = await response.json();
    
    if (response.ok) {
      alert('Categoria criada com sucesso!');
      document.getElementById('category-form').reset();
      document.getElementById('category-color').value = '#3498db';
      await loadCategories();
    } else {
      alert(result.error || 'Erro ao criar categoria');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor');
  }
}

// Deletar categoria
async function deleteCategory(id) {
  showConfirmModal('Tem certeza que deseja deletar esta categoria?', async () => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Categoria removida com sucesso!');
        loadCategories();
      } else {
        const result = await response.json();
        showToast(result.error || 'Erro ao deletar categoria', 'error');
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast('Erro ao conectar com o servidor', 'error');
    }
  });
}

// Exibir categorias
function displayCategories() {
  const container = document.getElementById('categoriesContainer');

  if (categories.length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhuma categoria disponível</p>';
    return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="category-card" style="border-left-color: ${cat.color}">
      <div class="category-info">
        <div class="category-name">${cat.name}</div>
      </div>
      <div class="category-actions">
        <button class="btn-delete-category" onclick="deleteCategory(${cat.id})">Deletar</button>
      </div>
    </div>
  `).join('');
}

// ===== UTILIDADES =====
function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}
