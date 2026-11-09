
"use strict";

// =============================================
// EXPENSEEASE PREMIUM FINANCE DASHBOARD 3.0
// Developer: Ankur Raj
// User ID: ankur_raj__
// =============================================

const STORAGE_KEY = "expenseEasePremiumV3";

// =============================================
// DOM ELEMENTS
// =============================================

const $ = (id) => document.getElementById(id);

const form = $("transactionForm");
const titleInput = $("titleInput");
const amountInput = $("amountInput");
const typeInput = $("typeInput");
const categoryInput = $("categoryInput");
const dateInput = $("dateInput");

let editingId = null;
let lineChart = null;
let donutChart = null;

const COLORS = [
    "#36D6A0",
    "#FF627C",
    "#4C8DF6",
    "#F6C65B",
    "#A78BFA",
    "#EC7AA9",
    "#32B8C8",
    "#FF955C"
];

const ICONS = {
    Food: "🍔",
    Travel: "🚕",
    Shopping: "🛍️",
    Education: "📚",
    Bills: "🧾",
    Entertainment: "🎬",
    Salary: "💼",
    Freelance: "💻",
    Other: "✦"
};

// =============================================
// DATE AND MONEY HELPERS
// =============================================

function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function monthsAgoDate(monthsAgo, day = 10) {
    const date = new Date();

    date.setDate(1);
    date.setMonth(date.getMonth() - monthsAgo);

    const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate();

    date.setDate(Math.min(day, lastDay));

    return localDate(date);
}

function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// =============================================
// DEMO DATA - 5 TRANSACTIONS
// =============================================

const demoTransactions = [
    {
        id: 1001,
        title: "Monthly Pocket Money",
        amount: 12000,
        type: "income",
        category: "Other",
        date: monthsAgoDate(0, 3)
    },
    {
        id: 1002,
        title: "Grocery Shopping",
        amount: 1850,
        type: "expense",
        category: "Food",
        date: monthsAgoDate(0, 5)
    },
    {
        id: 1003,
        title: "College Travel Pass",
        amount: 900,
        type: "expense",
        category: "Travel",
        date: monthsAgoDate(1, 12)
    },
    {
        id: 1004,
        title: "Freelance Web Project",
        amount: 4500,
        type: "income",
        category: "Freelance",
        date: monthsAgoDate(2, 18)
    },
    {
        id: 1005,
        title: "New Headphones",
        amount: 2200,
        type: "expense",
        category: "Shopping",
        date: monthsAgoDate(3, 20)
    }
];

// =============================================
// LOCAL STORAGE
// =============================================

function loadTransactions() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === null) {
            return demoTransactions.map(item => ({ ...item }));
        }

        const data = JSON.parse(saved);

        if (!Array.isArray(data)) {
            throw new Error("Invalid saved data");
        }

        return data;

    } catch (error) {
        console.error("Storage error:", error);

        return demoTransactions.map(item => ({ ...item }));
    }
}

let transactions = loadTransactions();

function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );

        return true;

    } catch (error) {
        console.error("Unable to save:", error);
        showMessage("Unable to save data in this browser.", true);
        return false;
    }
}

// =============================================
// CALCULATE TOTALS
// =============================================

function calculateTotals(items = transactions) {

    return items.reduce((totals, item) => {

        if (item.type === "income") {
            totals.income += Number(item.amount);
        } else {
            totals.expense += Number(item.amount);
        }

        return totals;

    }, {
        income: 0,
        expense: 0
    });
}

// =============================================
// DASHBOARD SUMMARY
// =============================================

function updateSummary() {

    const totals = calculateTotals();

    const balance = totals.income - totals.expense;

    $("balance").textContent = money(balance);
    $("income").textContent = money(totals.income);
    $("expense").textContent = money(totals.expense);
    $("count").textContent = transactions.length;

}

// =============================================
// MONTHLY REPORT
// =============================================

function updateMonthlyReport() {

    const monthKey = localDate().slice(0, 7);

    const monthlyItems = transactions.filter(item =>
        item.date.startsWith(monthKey)
    );

    const totals = calculateTotals(monthlyItems);

    const savings = totals.income - totals.expense;

    const ratio = totals.income > 0
        ? Math.max(0, Math.min(100,
            (savings / totals.income) * 100))
        : 0;

    $("monthlyIncome").textContent = money(totals.income);
    $("monthlyExpense").textContent = money(totals.expense);
    $("monthlySavings").textContent = money(savings);

    $("savingPercent").textContent =
        Math.round(ratio) + "%";

    $("savingBar").style.width = ratio + "%";

}

// =============================================
// TRANSACTION ICON
// =============================================

function getIcon(category) {
    return ICONS[category] || "✦";
}

// =============================================
// RECENT TRANSACTIONS
// =============================================

function displayRecentTransactions() {

    const container = $("recentTransactions");

    container.replaceChildren();

    const latest = [...transactions]
        .sort((a, b) =>
            b.date.localeCompare(a.date) || b.id - a.id
        )
        .slice(0, 5);

    if (latest.length === 0) {
        container.textContent = "No recent activity.";
        return;
    }

    latest.forEach(item => {

        const row = document.createElement("div");

        row.className = "transaction-row";

        const icon = document.createElement("div");
        icon.className = "transaction-icon";
        icon.textContent = getIcon(item.category);

        const details = document.createElement("div");

        const name = document.createElement("div");
        name.className = "transaction-name";
        name.textContent = item.title;

        const meta = document.createElement("div");
        meta.className = "transaction-meta";
        meta.textContent = `${item.category} · ${item.date}`;

        details.append(name, meta);

        const amount = document.createElement("div");

        amount.className =
            "transaction-amount " +
            (item.type === "income"
                ? "amount-income"
                : "amount-expense");

        amount.textContent =
            (item.type === "income" ? "+" : "−") +
            money(item.amount);

        row.append(icon, details, amount);

        container.appendChild(row);

    });

}

// =============================================
// ALL TRANSACTIONS TABLE
// =============================================

function displayTransactions() {

    const search = $("searchInput").value
        .toLowerCase()
        .trim();

    const typeFilter = $("filterType").value;
    const sortOrder = $("sortOrder").value;

    let filtered = transactions.filter(item => {

        const searchMatch =
            `${item.title} ${item.category}`
                .toLowerCase()
                .includes(search);

        const typeMatch =
            typeFilter === "all" ||
            item.type === typeFilter;

        return searchMatch && typeMatch;

    });

    filtered.sort((a, b) => {

        if (sortOrder === "oldest") {
            return a.date.localeCompare(b.date);
        }

        if (sortOrder === "highest") {
            return b.amount - a.amount;
        }

        if (sortOrder === "lowest") {
            return a.amount - b.amount;
        }

        return b.date.localeCompare(a.date) || b.id - a.id;

    });

    const tbody = $("transactionList");

    tbody.replaceChildren();

    filtered.forEach(item => {

        const row = document.createElement("tr");

        const titleCell = document.createElement("td");
        const titleWrap = document.createElement("div");
        titleWrap.className = "table-title";

        const icon = document.createElement("span");
        icon.className = "table-icon";
        icon.textContent = getIcon(item.category);

        const title = document.createElement("span");
        title.textContent = item.title;

        titleWrap.append(icon, title);
        titleCell.appendChild(titleWrap);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = item.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = item.date;

        const typeCell = document.createElement("td");
        const pill = document.createElement("span");

        pill.className = `type-pill ${item.type}`;
        pill.textContent =
            item.type === "income" ? "Income" : "Expense";

        typeCell.appendChild(pill);

        const amountCell = document.createElement("td");

        amountCell.className =
            item.type === "income"
                ? "amount-income"
                : "amount-expense";

        amountCell.textContent =
            (item.type === "income" ? "+" : "−") +
            money(item.amount);

        const actionCell = document.createElement("td");

        const actions = document.createElement("div");
        actions.className = "table-actions";

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = item.id;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = item.id;

        actions.append(editButton, deleteButton);
        actionCell.appendChild(actions);

        row.append(
            titleCell,
            categoryCell,
            dateCell,
            typeCell,
            amountCell,
            actionCell
        );

        tbody.appendChild(row);

    });

    $("emptyMessage").hidden = filtered.length > 0;

}

// =============================================
// DONUT CHART
// =============================================

function createDonutChart() {

    if (typeof Chart === "undefined") {
        console.warn("Chart.js not loaded. Check internet.");
        return;
    }

    const categoryTotals = {};

    transactions
        .filter(item => item.type === "expense")
        .forEach(item => {

            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0) +
                Number(item.amount);

        });

    const labels = Object.keys(categoryTotals);

    const values = labels.map(label =>
        categoryTotals[label]
    );

    const totalExpense = calculateTotals().expense;

    $("chartTotal").textContent = money(totalExpense);

    const chartLabels = labels.length
        ? labels
        : ["No expenses"];

    const chartValues = labels.length
        ? values
        : [1];

    const chartColors = labels.length
        ? labels.map((_, index) =>
            COLORS[index % COLORS.length])
        : ["#45405F"];

    if (donutChart) {
        donutChart.destroy();
    }

    donutChart = new Chart($("donutChart"), {

        type: "doughnut",

        data: {
            labels: chartLabels,

            datasets: [{
                data: chartValues,
                backgroundColor: chartColors,
                borderColor: "#211C50",
                borderWidth: 4,
                hoverOffset: 9,
                spacing: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "74%",

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: "#100D2C",
                    padding: 11,

                    callbacks: {
                        label: context =>
                            `${context.label}: ${money(context.raw)}`
                    }
                }
            }
        }

    });

    // Category legend
    const legend = $("categoryLegend");

    legend.replaceChildren();

    labels.forEach((label, index) => {

        const item = document.createElement("span");

        const dot = document.createElement("i");

        dot.style.backgroundColor =
            COLORS[index % COLORS.length];

        const text = document.createElement("span");
        text.textContent = label;

        item.append(dot, text);

        legend.appendChild(item);

    });

}

// =============================================
// LINE CHART - INCOME AND EXPENSES
// =============================================

function createLineChart() {

    if (typeof Chart === "undefined") return;

    const monthCount = Number($("chartPeriod").value);

    const months = [];

    for (let i = monthCount - 1; i >= 0; i--) {

        const date = new Date(
            new Date().getFullYear(),
            new Date().getMonth() - i,
            1
        );

        const key =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

        const label = date.toLocaleDateString("en-IN", {
            month: "short",
            year: monthCount === 12 ? "2-digit" : undefined
        });

        months.push({ key, label });

    }

    const incomeValues = months.map(month => {

        return transactions
            .filter(item =>
                item.type === "income" &&
                item.date.startsWith(month.key)
            )
            .reduce((sum, item) =>
                sum + Number(item.amount), 0);

    });

    const expenseValues = months.map(month => {

        return transactions
            .filter(item =>
                item.type === "expense" &&
                item.date.startsWith(month.key)
            )
            .reduce((sum, item) =>
                sum + Number(item.amount), 0);

    });

    if (lineChart) {
        lineChart.destroy();
    }

    lineChart = new Chart($("lineChart"), {

        type: "line",

        data: {
            labels: months.map(month => month.label),

            datasets: [

                {
                    label: "Income",
                    data: incomeValues,
                    borderColor: "#4C8DF6",
                    backgroundColor: "#4C8DF6",
                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#4C8DF6",
                    tension: 0.42,
                    fill: false
                },

                {
                    label: "Expenses",
                    data: expenseValues,
                    borderColor: "#FF627C",
                    backgroundColor: "#FF627C",
                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#FF627C",
                    tension: 0.42,
                    fill: false
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: "#100D2C",
                    padding: 12,

                    callbacks: {
                        label: context =>
                            `${context.dataset.label}: ${money(context.raw)}`
                    }
                }
            },

            scales: {

                x: {
                    grid: {
                        display: false
                    },

                    ticks: {
                        color: "#A9A2C8",
                        font: {
                            size: 9
                        }
                    },

                    border: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,

                    grid: {
                        color: "rgba(255,255,255,0.08)",
                        borderDash: [4, 4]
                    },

                    ticks: {
                        color: "#A9A2C8",
                        font: {
                            size: 9
                        },

                        callback: value =>
                            "₹" + Number(value).toLocaleString("en-IN")
                    },

                    border: {
                        display: false
                    }
                }

            }
        }

    });

}

// =============================================
// FORM MESSAGE
// =============================================

function showMessage(message, error = false) {

    const element = $("message");

    element.textContent = message;

    element.style.color = error
        ? "#FF8497"
        : "#36D6A0";

}

// =============================================
// RESET FORM
// =============================================

function resetForm() {

    form.reset();

    dateInput.value = localDate();
    dateInput.max = localDate();

    editingId = null;

    $("formTitle").textContent = "Create Transaction";

    $("submitButton").textContent = "＋ Save Transaction";

    $("cancelButton").hidden = true;

}

// =============================================
// ADD AND UPDATE TRANSACTIONS
// =============================================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
        showMessage("Please enter valid details.", true);
        return;
    }

    if (date > localDate()) {
        showMessage("Future dates are not allowed.", true);
        return;
    }

    const transaction = {
        id: editingId !== null ? editingId : Date.now(),
        title,
        amount,
        type,
        category,
        date
    };

    const previousTransactions = [...transactions];

    if (editingId !== null) {

        transactions = transactions.map(item =>
            item.id === editingId ? transaction : item
        );

    } else {

        transactions.push(transaction);

    }

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    resetForm();

    refreshDashboard();

    showMessage("✓ Transaction saved successfully!");

});

// =============================================
// EDIT AND DELETE
// =============================================

$("transactionList").addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    const item = transactions.find(transaction =>
        transaction.id === id
    );

    if (!item) return;

    if (button.dataset.action === "delete") {

        if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
            return;
        }

        const previousTransactions = [...transactions];

        transactions = transactions.filter(transaction =>
            transaction.id !== id
        );

        if (!saveTransactions()) {
            transactions = previousTransactions;
            return;
        }

        refreshDashboard();

        showMessage("Transaction deleted successfully.");

    }

    if (button.dataset.action === "edit") {

        editingId = id;

        titleInput.value = item.title;
        amountInput.value = item.amount;
        typeInput.value = item.type;
        categoryInput.value = item.category;
        dateInput.value = item.date;

        $("formTitle").textContent = "Update Transaction";

        $("submitButton").textContent = "✓ Update Transaction";

        $("cancelButton").hidden = false;

        $("add").scrollIntoView({
            behavior: "smooth"
        });

        titleInput.focus();

    }

});

// =============================================
// CANCEL EDIT
// =============================================

$("cancelButton").addEventListener("click", function() {

    resetForm();

    showMessage("Editing cancelled.");

});

// =============================================
// SEARCH, FILTER AND SORT
// =============================================

$("searchInput").addEventListener("input", displayTransactions);

$("filterType").addEventListener("change", displayTransactions);

$("sortOrder").addEventListener("change", displayTransactions);

// =============================================
// CHART PERIOD
// =============================================

$("chartPeriod").addEventListener("change", createLineChart);

// =============================================
// MOBILE SIDEBAR
// =============================================

$("menuButton").addEventListener("click", function() {

    $("sidebar").classList.toggle("open");

});

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", function() {

        document.querySelectorAll(".nav-link").forEach(nav =>
            nav.classList.remove("active")
        );

        this.classList.add("active");

        $("sidebar").classList.remove("open");

    });

});

// =============================================
// REFRESH DASHBOARD
// =============================================

function refreshDashboard() {

    updateSummary();

    updateMonthlyReport();

    displayRecentTransactions();

    displayTransactions();

    createDonutChart();

    createLineChart();

}

$("refreshButton").addEventListener("click", function() {

    refreshDashboard();

    showMessage("Dashboard refreshed.");

});

// =============================================
// INITIALIZE
// =============================================

$("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

dateInput.value = localDate();
dateInput.max = localDate();

refreshDashboard();
