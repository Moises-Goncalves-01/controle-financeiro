const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Banco de dados
const db = new sqlite3.Database('./finance.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
  } else {
    console.log('Banco de dados conectado');
    initializeDB();
  }
});

// Inicializar banco de dados com tabelas
function initializeDB() {
  // Criar tabelas em sequência
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        month TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT UNIQUE NOT NULL,
        amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT UNIQUE NOT NULL,
        amount REAL NOT NULL,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3498db',
        priority_level TEXT DEFAULT 'Normal',
        is_default BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela categories:', err);
      } else {
        // Inserir categorias padrão após criar a tabela
        insertDefaultCategories();
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS piggy_bank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        month TEXT NOT NULL,
        color TEXT DEFAULT '#3498db',
        priority_level TEXT DEFAULT 'Normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar coluna 'month' se não existir (migração para dados existentes)
    db.run(`
      ALTER TABLE piggy_bank ADD COLUMN month TEXT DEFAULT '2024-01'
    `, (err) => {
      // Ignorar erro se coluna já existe
    });
  });
}

function insertDefaultCategories() {
  const defaultCategories = [
    { name: 'Viagem', color: '#e74c3c', priority_level: 'Alta' },
    { name: 'Carro', color: '#3498db', priority_level: 'Normal' },
    { name: 'Casa', color: '#2ecc71', priority_level: 'Normal' },
    { name: 'Saúde', color: '#f39c12', priority_level: 'Alta' },
    { name: 'Educação', color: '#9b59b6', priority_level: 'Alta' },
    { name: 'Diversão', color: '#1abc9c', priority_level: 'Baixa' },
    { name: 'Eletrônicos', color: '#34495e', priority_level: 'Normal' },
    { name: 'Emergência', color: '#c0392b', priority_level: 'Crítica' }
  ];

  defaultCategories.forEach(cat => {
    db.run(
      'INSERT OR IGNORE INTO categories (name, color, priority_level, is_default) VALUES (?, ?, ?, 1)',
      [cat.name, cat.color, cat.priority_level],
      (err) => {
        if (err) {
          console.error('Erro ao inserir categoria padrão:', cat.name, err);
        }
      }
    );
  });
}

function getIncomeForMonth(month, callback) {
  db.get(
    'SELECT * FROM income WHERE month = ?',
    [month],
    (err, exactRow) => {
      if (err) {
        return callback(err);
      }

      if (exactRow) {
        return callback(null, {
          ...exactRow,
          isInherited: false,
          referenceMonth: exactRow.month
        });
      }

      db.get(
        'SELECT * FROM income WHERE month < ? ORDER BY month DESC LIMIT 1',
        [month],
        (fallbackErr, previousRow) => {
          if (fallbackErr) {
            return callback(fallbackErr);
          }

          if (!previousRow) {
            return callback(null, null);
          }

          callback(null, {
            ...previousRow,
            month,
            isInherited: true,
            referenceMonth: previousRow.month
          });
        }
      );
    }
  );
}

// ===== ROTAS DE GASTOS =====

// Adicionar gasto
app.post('/api/expenses', (req, res) => {
  const { description, amount, category, date } = req.body;
  
  if (!description || !amount || !category || !date) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const month = new Date(date).toISOString().slice(0, 7); // YYYY-MM

  db.run(
    'INSERT INTO expenses (description, amount, category, date, month) VALUES (?, ?, ?, ?, ?)',
    [description, amount, category, date, month],
    (err) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao adicionar gasto' });
      } else {
        res.json({ success: true, message: 'Gasto adicionado com sucesso' });
      }
    }
  );
});

// Obter gastos do mês
app.get('/api/expenses/:month', (req, res) => {
  const month = req.params.month; // YYYY-MM

  db.all(
    'SELECT * FROM expenses WHERE month = ? ORDER BY date DESC',
    [month],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar gastos' });
      } else {
        res.json(rows || []);
      }
    }
  );
});

// Obter todos os gastos
app.get('/api/expenses', (req, res) => {
  db.all(
    'SELECT * FROM expenses ORDER BY date DESC',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar gastos' });
      } else {
        res.json(rows || []);
      }
    }
  );
});

// Deletar gasto
app.delete('/api/expenses/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM expenses WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao deletar gasto' });
    } else {
      res.json({ success: true, message: 'Gasto removido com sucesso' });
    }
  });
});

// ===== ROTAS DE ORÇAMENTO =====

// Definir orçamento do mês
app.post('/api/budgets', (req, res) => {
  const { month, amount } = req.body;

  if (!month || !amount) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  db.run(
    'INSERT OR REPLACE INTO budgets (month, amount, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [month, amount],
    (err) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao definir orçamento' });
      } else {
        res.json({ success: true, message: 'Orçamento definido com sucesso' });
      }
    }
  );
});

// Obter orçamento do mês
app.get('/api/budgets/:month', (req, res) => {
  const month = req.params.month;

  db.get(
    'SELECT * FROM budgets WHERE month = ?',
    [month],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar orçamento' });
      } else {
        res.json(row || null);
      }
    }
  );
});

// ===== ROTAS DE RENDA =====

// Definir/atualizar renda do mês
app.post('/api/income', (req, res) => {
  const { month, amount, source } = req.body;

  if (!month || !amount) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  db.run(
    'INSERT OR REPLACE INTO income (month, amount, source, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    [month, amount, source || 'Salário'],
    (err) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao definir renda' });
      } else {
        res.json({ success: true, message: 'Renda registrada com sucesso' });
      }
    }
  );
});

// Obter renda do mês
app.get('/api/income/:month', (req, res) => {
  const month = req.params.month;

  getIncomeForMonth(month, (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao buscar renda' });
    } else {
      res.json(row || null);
    }
  });
});

// ===== ROTAS DE CATEGORIAS =====

// Obter todas as categorias
app.get('/api/categories', (req, res) => {
  db.all(
    'SELECT * FROM categories ORDER BY is_default DESC, name ASC',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar categorias' });
      } else {
        res.json(rows || []);
      }
    }
  );
});

// Criar nova categoria
app.post('/api/categories', (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }

  const categoryColor = color || '#3498db';
  
  db.run(
    'INSERT INTO categories (name, color, is_default) VALUES (?, ?, 0)',
    [name, categoryColor],
    function(err) {
      if (err) {
        console.error('Erro ao criar categoria:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(400).json({ error: 'Categoria já existe' });
        } else {
          res.status(500).json({ error: 'Erro ao criar categoria: ' + err.message });
        }
      } else {
        res.json({ success: true, message: 'Categoria criada com sucesso', id: this.lastID });
      }
    }
  );
});

// Deletar categoria
app.delete('/api/categories/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao deletar categoria' });
    } else {
      res.json({ success: true, message: 'Categoria removida com sucesso' });
    }
  });
});

// ===== ROTAS DE COFRE (PIGGY BANK) =====

// Adicionar economia no cofre
app.post('/api/piggy-bank', (req, res) => {
  const { name, amount, category, month, color, priority_level } = req.body;

  if (!name || !amount || !category || !month) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando: name, amount, category, month' });
  }

  db.run(
    'INSERT INTO piggy_bank (name, amount, category, month, color, priority_level) VALUES (?, ?, ?, ?, ?, ?)',
    [name, amount, category, month, color || '#3498db', priority_level || 'Normal'],
    function(err) {
      if (err) {
        console.error('Erro ao adicionar ao cofre:', err);
        res.status(500).json({ error: 'Erro ao adicionar ao cofre' });
      } else {
        res.json({ success: true, message: 'Adicionado ao cofre com sucesso', id: this.lastID });
      }
    }
  );
});

// Obter todas as economias do cofre
app.get('/api/piggy-bank', (req, res) => {
  db.all(
    'SELECT * FROM piggy_bank ORDER BY created_at DESC',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar cofre' });
      } else {
        res.json(rows || []);
      }
    }
  );
});

// Obter resumo do cofre de um mês específico (total guardado naquele mês)
app.get('/api/piggy-bank/summary/:month', (req, res) => {
  const month = req.params.month;
  
  db.get(
    'SELECT SUM(amount) as total FROM piggy_bank WHERE month = ?',
    [month],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar resumo do cofre' });
      } else {
        db.all(
          'SELECT category, SUM(amount) as total FROM piggy_bank WHERE month = ? GROUP BY category',
          [month],
          (err, categories) => {
            if (err) {
              res.status(500).json({ error: 'Erro ao buscar categorias do cofre' });
            } else {
              res.json({
                total: row?.total || 0,
                by_category: categories || []
              });
            }
          }
        );
      }
    }
  );
});

// Obter resumo do cofre (total guardado em todos os períodos)
app.get('/api/piggy-bank/summary', (req, res) => {
  db.get(
    'SELECT SUM(amount) as total FROM piggy_bank',
    (err, row) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar resumo do cofre' });
      } else {
        db.all(
          'SELECT category, SUM(amount) as total FROM piggy_bank GROUP BY category',
          (err, categories) => {
            if (err) {
              res.status(500).json({ error: 'Erro ao buscar categorias do cofre' });
            } else {
              res.json({
                total: row?.total || 0,
                by_category: categories || []
              });
            }
          }
        );
      }
    }
  );
});

// Deletar economia do cofre (sacar do cofre)
app.delete('/api/piggy-bank/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM piggy_bank WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao remover do cofre' });
    } else {
      res.json({ success: true, message: 'Removido do cofre com sucesso' });
    }
  });
});

// ===== ROTAS DE ESTATÍSTICAS =====

// Resumo completo do mês (renda, gastos, saldo)
app.get('/api/monthly-summary/:month', (req, res) => {
  const month = req.params.month;

  getIncomeForMonth(month, (err, incomeRow) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar renda' });
    }

    db.get(
      'SELECT SUM(amount) as totalExpenses FROM expenses WHERE month = ?',
      [month],
      (expenseErr, expenseRow) => {
        if (expenseErr) {
          return res.status(500).json({ error: 'Erro ao buscar gastos' });
        }

        const income = incomeRow ? incomeRow.amount : 0;
        const totalExpenses = expenseRow?.totalExpenses || 0;
        const balance = income - totalExpenses;

        res.json({
          month,
          income,
          source: incomeRow?.source || null,
          incomeInherited: incomeRow?.isInherited || false,
          incomeReferenceMonth: incomeRow?.referenceMonth || null,
          totalExpenses,
          balance,
          spent_percentage: income > 0 ? (totalExpenses / income) * 100 : 0,
        });
      }
    );
  });
});

// Resumo do mês por categoria
app.get('/api/summary/:month', (req, res) => {
  const month = req.params.month;

  db.all(
    'SELECT category, SUM(amount) as total FROM expenses WHERE month = ? GROUP BY category',
    [month],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar resumo' });
      } else {
        const totalSpent = rows.reduce((sum, row) => sum + row.total, 0);
        res.json({ categories: rows || [], totalSpent });
      }
    }
  );
});

// Comparação entre meses
app.get('/api/comparison', (req, res) => {
  db.all(
    `SELECT months.month,
            COALESCE(income_totals.income, 0) AS income,
            COALESCE(expense_totals.expenses, 0) AS expenses,
            COALESCE(expense_totals.expenses, 0) AS total
     FROM (
       SELECT month FROM income
       UNION
       SELECT month FROM expenses
     ) AS months
     LEFT JOIN (
       SELECT month, SUM(amount) AS income
       FROM income
       GROUP BY month
     ) AS income_totals ON income_totals.month = months.month
     LEFT JOIN (
       SELECT month, SUM(amount) AS expenses
       FROM expenses
       GROUP BY month
     ) AS expense_totals ON expense_totals.month = months.month
     ORDER BY months.month DESC
     LIMIT 12`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao buscar comparação' });
      } else {
        res.json(rows || []);
      }
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
