const generateMockData = () => {
    const data = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
        let month = today.getMonth() - i;
        let year = today.getFullYear();
        if (month < 0) { month += 12; year--; }
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        data.push({ id: Date.now() + Math.random(), type: 'income', amount: 4500 + Math.random() * 1000, date: `${monthStr}-05`, description: 'Salário', subtype: null });
        data.push({ id: Date.now() + Math.random(), type: 'expense', amount: 1500 + Math.random() * 200, date: `${monthStr}-10`, description: 'Aluguel', subtype: null });
        data.push({ id: Date.now() + Math.random(), type: 'expense', amount: 800 + Math.random() * 300, date: `${monthStr}-15`, description: 'Cartão de Crédito', subtype: null });
        data.push({ id: Date.now() + Math.random(), type: 'yield', amount: 200 + Math.random() * 150, date: `${monthStr}-20`, description: 'Venda Produto', subtype: 'Lucro' });
        if(i % 2 === 0) { data.push({ id: Date.now() + Math.random(), type: 'yield', amount: 50 + Math.random() * 20, date: `${monthStr}-25`, description: 'Dividendos FII', subtype: 'Dividendos' }); }
    }
    return data;
};

let transactions = JSON.parse(localStorage.getItem('minhasFinancas')) || generateMockData();
const todayStr = new Date().toISOString().slice(0, 7);
let selectedMonth = todayStr;
let myPieChart = null;
let myBarChart = null;

function salvarDados() {
    localStorage.setItem('minhasFinancas', JSON.stringify(transactions));
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formDate').valueAsDate = new Date();
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    setupMonthSelector();
    updateDashboard();
    document.getElementById('monthSelector').addEventListener('change', (e) => {
        selectedMonth = e.target.value;
        updateDashboard();
    });
});

function setupMonthSelector() {
    const selector = document.getElementById('monthSelector');
    const monthsSet = new Set(transactions.map(t => t.date.substring(0, 7)));
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);
    monthsSet.add(now.toISOString().slice(0, 7));
    monthsSet.add(nextMonth.toISOString().slice(0, 7));
    
    const sortedMonths = Array.from(monthsSet).sort().reverse();
    selector.innerHTML = '';
    sortedMonths.forEach(m => {
        const [year, month] = m.split('-');
        const dateObj = new Date(year, month - 1);
        const label = dateObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const option = document.createElement('option');
        option.value = m;
        option.textContent = label.charAt(0).toUpperCase() + label.slice(1);
        if(m === selectedMonth) option.selected = true;
        selector.appendChild(option);
    });
}

// A versão atualizada da função addTransaction:
function addTransaction(e) {
    e.preventDefault();
    
    const type = document.getElementById('formType').value;
    const amountRaw = document.getElementById('formValue').value;
    const dateRaw = document.getElementById('formDate').value;
    const desc = document.getElementById('formDesc').value;
    const subtype = type === 'yield' ? document.getElementById('formYieldType').value : null;

    const amount = parseFloat(amountRaw);
    if (isNaN(amount)) {
        alert("Por favor, insira um valor numérico válido.");
        return;
    }

    const newTx = { id: Date.now(), type, amount, date: dateRaw, description: desc, subtype: subtype };
    
    transactions.push(newTx);
    salvarDados(); 
    
    document.getElementById('formDesc').value = '';
    document.getElementById('formValue').value = '';
    
    setupMonthSelector();
    selectedMonth = dateRaw.substring(0, 7);
    document.getElementById('monthSelector').value = selectedMonth;
    
    updateDashboard();
}

function deleteTransaction(id) {
    if (confirm('Deseja realmente excluir este lançamento?')) {
        transactions = transactions.filter(t => t.id !== id);
        salvarDados(); 
        updateDashboard(); 
    }
}

function updateDashboard() {
    const currentMonthTx = transactions.filter(t => t.date.substring(0, 7) === selectedMonth);
    let sumIn = 0, sumOut = 0, sumYld = 0;
    currentMonthTx.forEach(t => { if(t.type === 'income') sumIn += t.amount; if(t.type === 'expense') sumOut += t.amount; if(t.type === 'yield') sumYld += t.amount; });
    const balance = sumIn + sumYld - sumOut;
    document.getElementById('sumIncome').textContent = formatCurrency(sumIn);
    document.getElementById('sumExpense').textContent = formatCurrency(sumOut);
    document.getElementById('sumYield').textContent = formatCurrency(sumYld);
    document.getElementById('sumBalance').textContent = formatCurrency(balance);
    document.getElementById('sumBalance').className = balance < 0 ? 'text-2xl font-bold mt-4 text-rose-400' : 'text-2xl font-bold mt-4 text-emerald-400';
    renderTransactionList(currentMonthTx);
    renderPieChart(sumIn, sumOut, sumYld);
    renderBarChart();
}

function renderTransactionList(txList) {
    const listEl = document.getElementById('transactionList');
    listEl.innerHTML = '';
    txList.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const li = document.createElement('li');
        li.className = "flex justify-between items-center p-3 hover:bg-stone-50 rounded-lg border border-transparent hover:border-stone-100 transition-colors group";
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'text-emerald-500 bg-emerald-50' : (t.type === 'expense' ? 'text-rose-500 bg-rose-50' : 'text-teal-500 bg-teal-50')}">
                    <i class="fa-solid ${t.type === 'income' ? 'fa-arrow-up' : (t.type === 'expense' ? 'fa-arrow-down' : 'fa-chart-line')} text-xs"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-stone-800">${t.description}</p>
                    <p class="text-xs text-stone-500">${formatDateShort(t.date)}</p>
                </div>
            </div>
            <div class="flex items-center">
                <div class="text-sm font-bold ${t.type === 'expense' ? 'text-stone-800' : 'text-emerald-600'}">
                    ${t.type === 'expense' ? '- ' : '+ '}${formatCurrency(t.amount)}
                </div>
                <button onclick="deleteTransaction(${t.id})" class="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>`;
        listEl.appendChild(li);
    });
}

// Funções utilitárias mantidas igual ao seu original:
const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatDateShort = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}`; };
function setFormType(type) { /* ... mantenha sua função original ... */ }
function renderPieChart(incomes, expenses, yields) { /* ... mantenha sua função original ... */ }
function renderBarChart() { /* ... mantenha sua função original ... */ }
