// ===============================
// EXPENSE & BUDGET VISUALIZER
// ===============================


// DOM ELEMENTS

const expenseForm = document.getElementById("expenseForm");

const itemNameInput = document.getElementById("itemName");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");

const customCategoryInput = document.getElementById("customCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");

const transactionList = document.getElementById("transactionList");
const emptyMessage = document.getElementById("emptyMessage");

const totalBalance = document.getElementById("totalBalance");

const sortSelect = document.getElementById("sortSelect");

const themeToggle = document.getElementById("themeToggle");

const emptyChartMessage = document.getElementById(
    "emptyChartMessage"
);

const chartCanvas = document.getElementById(
    "expenseChart"
);


// ===============================
// DATA
// ===============================

let transactions = JSON.parse(
    localStorage.getItem("transactions")
) || [];

let customCategories = JSON.parse(
    localStorage.getItem("customCategories")
) || [];

let expenseChart = null;


// ===============================
// FORMAT CURRENCY
// ===============================

function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}


// ===============================
// SAVE DATA
// ===============================

function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

function saveCategories() {
    localStorage.setItem(
        "customCategories",
        JSON.stringify(customCategories)
    );
}


// ===============================
// CATEGORY ICON
// ===============================

function getCategoryIcon(category) {

    const icons = {
        Food: "🍔",
        Transport: "🚗",
        Fun: "🎮"
    };

    return icons[category] || "💳";
}


// ===============================
// ADD CUSTOM CATEGORY
// ===============================

addCategoryBtn.addEventListener("click", () => {

    const categoryName =
        customCategoryInput.value.trim();

    if (!categoryName) {
        alert("Please enter a category name.");
        return;
    }

    const exists = [...categorySelect.options]
        .some(option =>
            option.value.toLowerCase() ===
            categoryName.toLowerCase()
        );

    if (exists) {
        alert("This category already exists.");
        return;
    }

    const option = document.createElement("option");

    option.value = categoryName;
    option.textContent = categoryName;

    categorySelect.appendChild(option);

    customCategories.push(categoryName);

    saveCategories();

    categorySelect.value = categoryName;

    customCategoryInput.value = "";
});


// ===============================
// LOAD CUSTOM CATEGORIES
// ===============================

function loadCustomCategories() {

    customCategories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categorySelect.appendChild(option);
    });
}


// ===============================
// ADD TRANSACTION
// ===============================

expenseForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const itemName = itemNameInput.value.trim();

    const amount = Number(amountInput.value);

    const category = categorySelect.value;


    // VALIDATION

    if (!itemName || !amount || !category) {

        alert(
            "Please fill in all fields before adding a transaction."
        );

        return;
    }

    if (amount <= 0) {

        alert("Amount must be greater than zero.");

        return;
    }


    // CREATE TRANSACTION

    const transaction = {

        id: Date.now(),

        name: itemName,

        amount: amount,

        category: category,

        date: new Date().toISOString()

    };


    transactions.push(transaction);

    saveTransactions();


    // RESET FORM

    expenseForm.reset();


    // UPDATE UI

    renderTransactions();

    updateBalance();

    updateChart();
});


// ===============================
// DELETE TRANSACTION
// ===============================

function deleteTransaction(id) {

    transactions = transactions.filter(
        transaction => transaction.id !== id
    );

    saveTransactions();

    renderTransactions();

    updateBalance();

    updateChart();
}


// ===============================
// SORT TRANSACTIONS
// ===============================

function getSortedTransactions() {

    const sorted = [...transactions];

    const sortType = sortSelect.value;


    if (sortType === "newest") {

        sorted.sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    }


    if (sortType === "amountHigh") {

        sorted.sort(
            (a, b) =>
                b.amount - a.amount
        );

    }


    if (sortType === "amountLow") {

        sorted.sort(
            (a, b) =>
                a.amount - b.amount
        );

    }


    if (sortType === "category") {

        sorted.sort(
            (a, b) =>
                a.category.localeCompare(
                    b.category
                )
        );

    }


    return sorted;
}

sortSelect.addEventListener(
    "change",
    renderTransactions
);


// ===============================
// RENDER TRANSACTIONS
// ===============================

function renderTransactions() {

    transactionList.innerHTML = "";

    const sortedTransactions =
        getSortedTransactions();


    if (sortedTransactions.length === 0) {

        emptyMessage.style.display = "block";

        return;
    }


    emptyMessage.style.display = "none";


    sortedTransactions.forEach(transaction => {

        const item =
            document.createElement("div");

        item.className = "transaction-item";


        item.innerHTML = `

            <div class="transaction-info">

                <div class="category-icon">
                    ${getCategoryIcon(transaction.category)}
                </div>

                <div>

                    <div class="transaction-name">
                        ${escapeHTML(transaction.name)}
                    </div>

                    <div class="transaction-category">
                        ${escapeHTML(transaction.category)}
                    </div>

                </div>

            </div>


            <div class="transaction-right">

                <span class="transaction-amount">
                    ${formatCurrency(transaction.amount)}
                </span>

                <button
                    class="delete-btn"
                    onclick="deleteTransaction(${transaction.id})"
                    aria-label="Delete transaction"
                >
                    🗑️
                </button>

            </div>
        `;


        transactionList.appendChild(item);
    });
}


// ===============================
// PREVENT HTML INJECTION
// ===============================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ===============================
// UPDATE TOTAL BALANCE
// ===============================

function updateBalance() {

    const total = transactions.reduce(
        (sum, transaction) =>
            sum + transaction.amount,
        0
    );

    totalBalance.textContent =
        formatCurrency(total);
}


// ===============================
// UPDATE PIE CHART
// ===============================

function updateChart() {

    const categoryTotals = {};


    transactions.forEach(transaction => {

        if (!categoryTotals[transaction.category]) {

            categoryTotals[transaction.category] = 0;
        }

        categoryTotals[transaction.category] +=
            transaction.amount;
    });


    const labels =
        Object.keys(categoryTotals);

    const values =
        Object.values(categoryTotals);


    if (expenseChart) {

        expenseChart.destroy();

        expenseChart = null;
    }


    if (transactions.length === 0) {

        emptyChartMessage.style.display = "block";

        return;
    }


    emptyChartMessage.style.display = "none";


    expenseChart = new Chart(chartCanvas, {

        type: "pie",

        data: {

            labels: labels,

            datasets: [

                {

                    data: values,

                    borderWidth: 2

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom"

                },

                tooltip: {

                    callbacks: {

                        label: function(context) {

                            const value =
                                context.raw;

                            return ` ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }

    });
}


// ===============================
// DARK / LIGHT MODE
// ===============================

function loadTheme() {

    const savedTheme =
        localStorage.getItem("theme");


    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        themeToggle.textContent = "☀️";

    } else {

        themeToggle.textContent = "🌙";
    }
}


themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("dark");


        const isDark =
            document.body.classList.contains("dark");


        localStorage.setItem(
            "theme",
            isDark ? "dark" : "light"
        );


        themeToggle.textContent =
            isDark ? "☀️" : "🌙";
    }
);


// ===============================
// INITIALIZE APP
// ===============================

loadCustomCategories();

loadTheme();

renderTransactions();

updateBalance();

updateChart();
