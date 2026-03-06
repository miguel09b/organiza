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

let transactions = generateMockData();
const todayStr = new Date().toISOString().slice(0, 7);
let selectedMonth = todayStr;
let myPieChart = null;
let myBarChart = null;

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
    const monthsSet = new Set([todayStr, ...transactions.map(t => t.date.substring(0, 7))]);
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

function setFormType(type) {
    document.getElementById('formType').value = type;
    ['income', 'expense', 'yield'].forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        el.classList.remove('border-emerald-500', 'text-emerald-600', 'border-rose-500', 'text-rose-600', 'border-teal-500', 'text-teal-600');
        el.classList.add('border-transparent', 'text-stone-500');
    });
    const activeTab = document.getElementById(`tab-${type}`);
    const btnSubmit = document.getElementById('btnSubmit');
    const yieldContainer = document.getElementById('yieldTypeContainer');
    yieldContainer.classList.add('hidden');
    if (type === 'income') { activeTab.classList.add('border-emerald-500', 'text-emerald-600'); btnSubmit.textContent = 'Adicionar Recebimento'; btnSubmit.className = 'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-md transition-colors text-sm mt-2'; } 
    else if (type === 'expense') { activeTab.classList.add('border-rose-500', 'text-rose-600'); btnSubmit.textContent = 'Adicionar Gasto'; btnSubmit.className = 'w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-md transition-colors text-sm mt-2'; } 
    else if (type === 'yield') { activeTab.classList.add('border-teal-500', 'text-teal-600'); btnSubmit.textContent = 'Adicionar Rendimento/Lucro'; btnSubmit.className = 'w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-md transition-colors text-sm mt-2'; yieldContainer.classList.remove('hidden'); }
}

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatDateShort = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}`; };

function addTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('formType').value;
    const newTx = { id: Date.now(), type, amount: parseFloat(document.getElementById('formValue').value), date: document.getElementById('formDate').value, description: document.getElementById('formDesc').value, subtype: type === 'yield' ? document.getElementById('formYieldType').value : null };
    transactions.push(newTx);
    document.getElementById('formDesc').value = '';
    document.getElementById('formValue').value = '';
    setupMonthSelector();
    const txMonth = newTx.date.substring(0, 7);
    if(txMonth !== selectedMonth) { selectedMonth = txMonth; document.getElementById('monthSelector').value = selectedMonth; }
    updateDashboard();
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
    const balanceEl = document.getElementById('sumBalance');
    balanceEl.className = balance < 0 ? 'text-2xl font-bold mt-4 text-rose-400' : 'text-2xl font-bold mt-4 text-emerald-400';
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
        
        const botaoExcluir = `
            <button onclick="deleteTransaction(${t.id})" class="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        let iconClass = t.type === 'income' ? 'fa-arrow-up' : (t.type === 'expense' ? 'fa-arrow-down' : 'fa-chart-line');
        let colorClass = t.type === 'income' ? 'text-emerald-500 bg-emerald-50' : (t.type === 'expense' ? 'text-rose-500 bg-rose-50' : 'text-teal-500 bg-teal-50');
        
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center ${colorClass}">
                    <i class="fa-solid ${iconClass} text-xs"></i>
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
                ${botaoExcluir}
            </div>`;
        listEl.appendChild(li);
    });
}

function deleteTransaction(id) {
    if (confirm('Deseja realmente excluir este lançamento?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateDashboard(); 
    }
}

function renderPieChart(incomes, expenses, yields) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (myPieChart) myPieChart.destroy();
    if (incomes === 0 && expenses === 0 && yields === 0) { ctx.canvas.style.display = 'none'; return; }
    ctx.canvas.style.display = 'block';
    myPieChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Recebimentos', 'Rendimentos/Lucros', 'Gastos'], datasets: [{ data: [incomes, yields, expenses], backgroundColor: ['#10b981', '#14b8a6', '#f43f5e'] }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%' } });
}

function renderBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (myBarChart) myBarChart.destroy();
    const [selYear, selMonth] = selectedMonth.split('-');
    const d = new Date(selYear, selMonth - 1);
    const labels = [], dataIn = [], dataOut = [];
    for (let i = 5; i >= 0; i--) {
        const checkDate = new Date(d.getFullYear(), d.getMonth() - i);
        const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
        labels.push(checkDate.toLocaleString('pt-BR', { month: 'short' }));
        const monthTx = transactions.filter(t => t.date.substring(0, 7) === checkStr);
        let sIn = 0, sOut = 0;
        monthTx.forEach(t => { if(t.type === 'income' || t.type === 'yield') sIn += t.amount; if(t.type === 'expense') sOut += t.amount; });
        dataIn.push(sIn); dataOut.push(sOut);
    }
    myBarChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Entradas', data: dataIn, backgroundColor: '#10b981' }, { label: 'Gastos', data: dataOut, backgroundColor: '#f43f5e' }] }, options: { responsive: true, maintainAspectRatio: false } });
}