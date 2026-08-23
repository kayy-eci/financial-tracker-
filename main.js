const STORAGE_KEY = 'expenseTrackerTransactions';
let transactions = loadTransactions();
let editingTransactionId = null;

function generateId() {
  return Date.now() + Math.random();
}

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function updateDashboard() {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpense;

  const balanceElement = document.querySelector('.tracker-summary__balance-amount');
  const incomeElement = document.querySelector('.tracker-summary__stat-amount--income');
  const expenseElement = document.querySelector('.tracker-summary__stat-amount--expense');

  if (balanceElement) balanceElement.textContent = formatCurrency(balance);
  if (incomeElement) incomeElement.textContent = formatCurrency(totalIncome);
  if (expenseElement) expenseElement.textContent = formatCurrency(totalExpense);
}

function resetForm() {
  const transactionForm = document.getElementById('transactionForm');
  const submitButton = document.querySelector('[data-testid="transactionFormSubmitButton"]');

  if (transactionForm) transactionForm.reset();
  if (submitButton) submitButton.textContent = 'Simpan';
  editingTransactionId = null;

  const typeSelect = document.getElementById('transactionFormTypeSelect');
  if (typeSelect) typeSelect.value = 'income';
}

function populateFormForEdit(transactionId) {
  const targetTransaction = transactions.find((transaction) => transaction.id === transactionId);
  if (!targetTransaction) return;

  const titleInput = document.getElementById('transactionFormTitleInput');
  const amountInput = document.getElementById('transactionFormAmountInput');
  const dateInput = document.getElementById('transactionFormDateInput');
  const typeSelect = document.getElementById('transactionFormTypeSelect');
  const submitButton = document.querySelector('[data-testid="transactionFormSubmitButton"]');

  if (titleInput) titleInput.value = targetTransaction.title;
  if (amountInput) amountInput.value = targetTransaction.amount;
  if (dateInput) dateInput.value = targetTransaction.date;
  if (typeSelect) typeSelect.value = targetTransaction.type;
  if (submitButton) submitButton.textContent = 'Perbarui';

  editingTransactionId = targetTransaction.id;
  titleInput.focus();
}

function renderTransactions(filteredTransactions = transactions) {
  const incomeList = document.getElementById('incomeList');
  const expenseList = document.getElementById('expenseList');

  if (!incomeList || !expenseList) return;

  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  filteredTransactions.forEach((transaction) => {
    const item = document.createElement('div');
    item.className = 'tracker-transaction-item';
    item.setAttribute('data-testid', 'transactionItem');

    const icon = document.createElement('div');
    icon.className = `tracker-transaction-item__icon tracker-transaction-item__icon--${transaction.type}`;
    icon.textContent = transaction.type === 'income' ? '↗' : '↘';

    const detail = document.createElement('div');
    detail.className = 'tracker-transaction-item__detail';

    const title = document.createElement('h3');
    title.className = 'tracker-transaction-item__title';
    title.setAttribute('data-testid', 'transactionItemTitle');
    title.textContent = transaction.title;

    const amount = document.createElement('p');
    amount.className = 'tracker-transaction-item__amount';
    amount.setAttribute('data-testid', 'transactionItemAmount');
    amount.textContent = `Nominal: ${formatCurrency(transaction.amount)}`;

    const date = document.createElement('p');
    date.className = 'tracker-transaction-item__date';
    date.setAttribute('data-testid', 'transactionItemDate');
    date.textContent = `Tanggal: ${transaction.date || '-'}`;

    const type = document.createElement('p');
    type.className = 'tracker-transaction-item__date';
    type.setAttribute('data-testid', 'transactionItemType');
    type.textContent = `Tipe: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

    detail.append(title, amount, date, type);

    const actionGroup = document.createElement('div');
    actionGroup.className = 'tracker-transaction-item__actions';

    const editTypeButton = document.createElement('button');
    editTypeButton.type = 'button';
    editTypeButton.className = 'tracker-transaction-item__btn';
    editTypeButton.setAttribute('data-testid', 'transactionItemEditTypeButton');
    editTypeButton.textContent = 'Ubah Tipe';
    editTypeButton.addEventListener('click', () => {
      const index = transactions.findIndex((entry) => entry.id === transaction.id);
      if (index === -1) return;

      transactions[index].type = transactions[index].type === 'income' ? 'expense' : 'income';
      saveTransactions();
      document.dispatchEvent(new Event('transaction:updated'));
    });

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'tracker-transaction-item__btn';
    editButton.setAttribute('data-testid', 'transactionItemEditButton');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      populateFormForEdit(transaction.id);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'tracker-transaction-item__btn';
    deleteButton.setAttribute('data-testid', 'transactionItemDeleteButton');
    deleteButton.textContent = 'Hapus';
    deleteButton.addEventListener('click', () => {
      transactions = transactions.filter((entry) => entry.id !== transaction.id);
      saveTransactions();
      document.dispatchEvent(new Event('transaction:updated'));
    });

    actionGroup.append(editTypeButton, editButton, deleteButton);

    item.append(icon, detail, actionGroup);

    if (transaction.type === 'income') {
      incomeList.appendChild(item);
    } else {
      expenseList.appendChild(item);
    }
  });
}

function handleSubmitTransaction(event) {
  event.preventDefault();

  const titleInput = document.getElementById('transactionFormTitleInput');
  const amountInput = document.getElementById('transactionFormAmountInput');
  const dateInput = document.getElementById('transactionFormDateInput');
  const typeSelect = document.getElementById('transactionFormTypeSelect');

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value || new Date().toISOString().slice(0, 10);
  const type = typeSelect.value;

  if (!title) {
    alert('Judul transaksi tidak boleh kosong.');
    return;
  }

  if (amount < 1) {
    alert('Nominal transaksi minimal 1 Rupiah.');
    return;
  }

  if (editingTransactionId !== null) {
    transactions = transactions.map((transaction) => {
      if (transaction.id === editingTransactionId) {
        return {
          ...transaction,
          title,
          amount,
          date,
          type,
        };
      }
      return transaction;
    });
  } else {
    transactions.push({
      id: generateId(),
      title,
      amount,
      date,
      type,
    });
  }

  saveTransactions();
  resetForm();
  document.dispatchEvent(new Event('transaction:updated'));
}

function initializeApp() {
  const transactionForm = document.getElementById('transactionForm');
  const searchInput = document.getElementById('searchTransactionFormTitleInput');
  const searchForm = document.getElementById('searchTransactionForm');

  if (transactionForm) {
    transactionForm.addEventListener('submit', handleSubmitTransaction);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      const keyword = event.target.value.trim().toLowerCase();
      const filteredTransactions = keyword
        ? transactions.filter((transaction) => transaction.title.toLowerCase().includes(keyword))
        : transactions;

      renderTransactions(filteredTransactions);
    });
  }

  document.addEventListener('transaction:updated', () => {
    updateDashboard();
    renderTransactions();
  });

  document.dispatchEvent(new Event('transaction:updated'));
}

initializeApp();
