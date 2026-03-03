// ============= GLOBAL STATE =============

let currentUser = null;
let allExpenses = [];
let filteredExpenses = [];
let isLoading = false;

// Filter state
let filters = {
  fromDate: null,
  toDate: null,
  categories: []
};

// Complete category list (matches HTML optgroups) - 130+ categories
const CATEGORIES = {
  "Income": [
    "Salary", "Bonus", "Business Profit", "Freelance and Contract", 
    "Rental Income", "Dividends and Interest", "Gifts Received", 
    "Refunds", "Sale of Items"
  ],
  "Food and Drinks": [
    "Groceries", "Fruits", "Restaurant and Dining", "Fast Food", 
    "Snacks", "Coffee and Tea", "Food Delivery", "Alcohol and Bars", 
    "Dietary Supplements"
  ],
  "Housing and Utilities": [
    "Rent", "Mortgage", "Property Tax", "Home Insurance", 
    "Electricity", "DTH", "Water", "Gas and Heating", 
    "Internet and WiFi", "Cable TV", "Mobile Recharge", 
    "Maintenance and Repairs", "Furniture and Decor", 
    "Cleaning Services", "HOA Fees", "Garden and Lawn"
  ],
  "Transport": [
    "Fuel", "Car Loan and Lease", "Vehicle Insurance", 
    "Vehicle Maintenance", "Public Transport", "Taxi and Cab", 
    "Parking", "Tolls", "Car Wash", "Registration Fees"
  ],
  "Shopping": [
    "Clothing", "Footwear", "Accessories", "Electronics", 
    "Beauty and Cosmetics", "Jewelry", "Sporting Goods", 
    "Hobbies", "Online Shopping"
  ],
  "Health and Medical": [
    "Doctor", "Dentist", "Eye Care", "Pharmacy", 
    "Hospital Bill", "Health Insurance", "GYM", 
    "Mental Health", "Wellness and Spa"
  ],
  "Family and Kids": [
    "Family", "Childcare", "School Fees", "Tuition", 
    "School Supplies", "Toys and Games", "Baby Supplies", 
    "Child Support", "Elder Care"
  ],
  "Education": [
    "Books", "Online Courses", "University Fees", 
    "Student Loan", "Certifications", "Seminars"
  ],
  "Tech and Subscription": [
    "Software", "Mobile Apps", "Cloud Storage", 
    "VPN and Antivirus", "Hosting"
  ],
  "Entertainment": [
    "Movies", "Streaming Subscription", "Music", 
    "Video Games", "Concerts and Events", "Nightlife", 
    "Sports Matches", "Lottery"
  ],
  "Travel": [
    "Flights", "Train", "Hotels", "Travel Food", 
    "Sightseeing", "Visa Fees", "Travel Insurance", "Souvenirs"
  ],
  "Financial": [
    "Credit Card Payment", "EMI", "Bank Charges", "Investments", 
    "Savings Transfer", "Life Insurance", "Income Tax", 
    "Fines", "Legal Fees", "Accounting Fees"
  ],
  "Personal and Misc": [
    "Personal Care", "Salon", "Laundry", "Gifts Given", 
    "Donations", "Pet Food", "Pet Medical", "Religious Expenses", 
    "Office Supplies", "Shipping", "Lost Items", 
    "Emergency Fund", "Other"
  ]
};

// ============= INITIALIZATION =============

requireAuth();

async function loadUser() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      console.error("User load error:", error);
      window.location.href = "index.html";
      return;
    }

    currentUser = user;

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile load error:", profileError);
    }

    const welcomeText = document.getElementById("welcome-text");
    welcomeText.innerText = profile?.name 
      ? `Welcome 👋 ${profile.name}` 
      : "Welcome 👋";

    await loadExpensesAndTotals();

  } catch (error) {
    console.error("Load user error:", error);
    showToast("Failed to load user data", "error");
  }
}

loadUser();

// ============= MULTI-SELECT CATEGORY DROPDOWN =============

function initializeCategoryDropdown() {
  const optionsContainer = document.getElementById("category-options");
  
  // Return silently if element doesn't exist yet - will be called again in DOMContentLoaded
  if (!optionsContainer) return;
  
  let html = '';
  
  Object.keys(CATEGORIES).forEach(group => {
    html += `<div class="category-group">`;
    html += `<div class="category-group-header">${group}</div>`;
    
    CATEGORIES[group].forEach(category => {
      html += `
        <label class="category-option">
          <input type="checkbox" value="${category}" onchange="updateCategorySelection()">
          <span>${category}</span>
        </label>
      `;
    });
    
    html += `</div>`;
  });
  
  optionsContainer.innerHTML = html;
}

function toggleCategoryDropdown() {
  const dropdown = document.getElementById("category-dropdown");
  dropdown.classList.toggle("hidden");
  
  if (!dropdown.classList.contains("hidden")) {
    setTimeout(() => {
      document.addEventListener("click", closeCategoryDropdownOutside);
    }, 0);
  } else {
    document.removeEventListener("click", closeCategoryDropdownOutside);
  }
}

function closeCategoryDropdownOutside(e) {
  const dropdown = document.getElementById("category-dropdown");
  const trigger = document.querySelector(".multi-select-trigger");
  
  if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
    dropdown.classList.add("hidden");
    document.removeEventListener("click", closeCategoryDropdownOutside);
  }
}

function updateCategorySelection() {
  const checkboxes = document.querySelectorAll("#category-options input[type='checkbox']");
  
  const selected = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value.trim());

  // ✅ Force new reference (important)
  filters = {
    ...filters,
    categories: selected
  };

  // Update display text
  const display = document.getElementById("category-display");
  if (!display) return;

  if (selected.length === 0) {
    display.textContent = "All Categories";
  } else if (selected.length === 1) {
    display.textContent = selected[0];
  } else {
    display.textContent = `${selected.length} Categories Selected`;
  }

  // ✅ Force apply
  setTimeout(() => {
    applyFilters();
  }, 0);
}

function selectAllCategories() {
  const checkboxes = document.querySelectorAll("#category-options input[type='checkbox']");
  checkboxes.forEach(cb => cb.checked = true);
  updateCategorySelection();
}

function clearCategorySelection() {
  const checkboxes = document.querySelectorAll("#category-options input[type='checkbox']");
  checkboxes.forEach(cb => cb.checked = false);
  
  // Reset the display text
  const display = document.getElementById("category-display");
  if (display) {
    display.textContent = "All Categories";
  }
  
  // Reset filter state
  filters.categories = [];
  
  // Apply filters if we have data
  if (allExpenses.length > 0) {
    applyFilters();
  }
}

function filterCategories() {
  const searchTerm = document.getElementById("category-search").value.toLowerCase();
  const options = document.querySelectorAll(".category-option");
  
  options.forEach(option => {
    const text = option.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      option.style.display = "flex";
    } else {
      option.style.display = "none";
    }
  });
}

// ============= DATA LOADING =============

async function loadExpensesAndTotals() {
  if (isLoading) return;
  
  isLoading = true;
  const tbody = document.getElementById("expense-body");
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; opacity: 0.5;">Loading...</td></tr>';

  try {
    const { data, error } = await supabaseClient
      .from("expenses")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Load expenses error:", error);
      showToast("Failed to load expenses", "error");
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to load data</td></tr>';
      return;
    }

    allExpenses = data || [];
    applyFilters();

  } catch (error) {
    console.error("Load expenses error:", error);
    showToast("Something went wrong", "error");
  } finally {
    isLoading = false;
  }
}

// ============= FILTER FUNCTIONALITY =============

function applyFilters() {
  let filtered = [...allExpenses];

  // Filter by date range
  if (filters.fromDate) {
    const fromDate = new Date(filters.fromDate);
    fromDate.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(exp => {
      const expDate = new Date(exp.expense_date);
      expDate.setHours(0, 0, 0, 0);
      return expDate >= fromDate;
    });
  }

  if (filters.toDate) {
    const toDate = new Date(filters.toDate);
    toDate.setHours(23, 59, 59, 999);
    
    filtered = filtered.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate <= toDate;
    });
  }

  // Filter by categories (multiple selection)
  // Filter by categories (multiple selection)
if (filters.categories.length > 0) {
  console.log("Selected Categories:", filters.categories);

  filtered = filtered.filter(exp => {
    if (!exp.category) return false;

    const expenseCategory = exp.category.toString().trim();
    
    const match = filters.categories.includes(expenseCategory);

    console.log("Checking:", expenseCategory, "Match:", match);

    return match;
  });
}

  filteredExpenses = filtered;
  renderExpensesTable(filteredExpenses);
  updateTotals(filteredExpenses);
  updateFilterBadge();
  
  // Log for debugging
  console.log('Applied filters:', {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    categories: filters.categories,
    totalExpenses: allExpenses.length,
    filteredCount: filtered.length
  });
}

function handleFilterChange() {
  const fromDateInput = document.getElementById("filter-from-date");
  const toDateInput = document.getElementById("filter-to-date");

  filters.fromDate = fromDateInput.value || null;
  filters.toDate = toDateInput.value || null;

  if (filters.fromDate && filters.toDate) {
    const from = new Date(filters.fromDate);
    const to = new Date(filters.toDate);
    
    if (from > to) {
      showToast("From date cannot be after To date", "error");
      return;
    }
  }

  applyFilters();
  
  if (filters.fromDate || filters.toDate || filters.categories.length > 0) {
    let filterMsg = "Filters applied";
    if (filters.categories.length > 0) {
      filterMsg += ` - ${filters.categories.length} ${filters.categories.length === 1 ? 'category' : 'categories'}`;
    }
    showToast(filterMsg, "success");
  }
}

function clearFilters() {
  // Clear date inputs
  const fromDate = document.getElementById("filter-from-date");
  const toDate = document.getElementById("filter-to-date");
  
  if (fromDate) fromDate.value = "";
  if (toDate) toDate.value = "";
  
  // Clear category selection
  clearCategorySelection();

  // Reset filter state
  filters = {
    fromDate: null,
    toDate: null,
    categories: []
  };

  applyFilters();
  showToast("Filters cleared", "info");
}

function updateFilterBadge() {
  const badge = document.getElementById("filter-badge");
  
  if (!badge) return;
  
  let activeFilters = 0;

  if (filters.fromDate) activeFilters++;
  if (filters.toDate) activeFilters++;
  if (filters.categories.length > 0) activeFilters++;

  if (activeFilters > 0) {
    badge.innerText = activeFilters;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function toggleFilters() {
  const filterSection = document.getElementById("filter-section");
  const filterBtn = document.getElementById("filter-btn");
  
  filterSection.classList.toggle("hidden");
  
  if (filterSection.classList.contains("hidden")) {
    const activeCount = (filters.fromDate ? 1 : 0) + (filters.toDate ? 1 : 0) + (filters.categories.length > 0 ? 1 : 0);
    const badgeHidden = activeCount === 0 ? ' hidden' : '';
    
    filterBtn.innerHTML = `
      🔍 Filters
      <span id="filter-badge" class="filter-badge${badgeHidden}">${activeCount}</span>
    `;
  } else {
    filterBtn.innerHTML = '✖ Close Filters';
  }
}

// ============= EXPORT FUNCTIONALITY =============

function exportToCSV() {
  const dataToExport = filteredExpenses.length > 0 ? filteredExpenses : allExpenses;

  if (dataToExport.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  const headers = ["Date", "Title", "Category", "Type", "Amount"];
  
  const rows = dataToExport.map(exp => {
    const date = new Date(exp.expense_date).toLocaleDateString('en-IN');
    const title = `"${exp.title.replace(/"/g, '""')}"`;
    const category = exp.category ? `"${exp.category}"` : "-";
    const type = exp.amount >= 0 ? "Income" : "Expense";
    const amount = Math.abs(exp.amount);
    
    return [date, title, category, type, amount].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `expense-tracker-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV exported successfully!", "success");
}

function exportToPDF() {
  const dataToExport = filteredExpenses.length > 0 ? filteredExpenses : allExpenses;

  if (dataToExport.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  const printWindow = window.open("", "_blank");
  
  let totalIncome = 0;
  let totalExpense = 0;
  
  dataToExport.forEach(exp => {
    if (exp.amount >= 0) {
      totalIncome += exp.amount;
    } else {
      totalExpense += Math.abs(exp.amount);
    }
  });

  const balance = totalIncome - totalExpense;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Expense Tracker Report</title>
      <style>
        @media print {
          @page { margin: 20mm; }
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #00ffa3;
          padding-bottom: 20px;
        }
        
        .header h1 {
          color: #0a0b14;
          font-size: 32px;
          margin: 0 0 10px 0;
        }
        
        .header p {
          color: #666;
          margin: 5px 0;
        }
        
        .summary {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-item h3 {
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          margin: 0 0 10px 0;
          letter-spacing: 1px;
        }
        
        .summary-item p {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        
        .income { color: #00ffa3; }
        .expense { color: #ff3b57; }
        .balance { color: #0a0b14; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
        }
        
        thead {
          background: #0a0b14;
          color: white;
        }
        
        th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        tbody tr:hover {
          background: #f8f9fa;
        }
        
        .amount-positive {
          color: #00ffa3;
          font-weight: bold;
        }
        
        .amount-negative {
          color: #ff3b57;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        
        .filters-applied {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .filters-applied h4 {
          margin: 0 0 10px 0;
          color: #856404;
        }
        
        .filters-applied p {
          margin: 5px 0;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💎 Expense Tracker Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })}</p>
        <p>Total Transactions: ${dataToExport.length}</p>
      </div>
      
      ${getFiltersHTML()}
      
      <div class="summary">
        <div class="summary-item">
          <h3>Total Income</h3>
          <p class="income">₹${totalIncome.toLocaleString('en-IN')}</p>
        </div>
        <div class="summary-item">
          <h3>Total Expense</h3>
          <p class="expense">₹${totalExpense.toLocaleString('en-IN')}</p>
        </div>
        <div class="summary-item">
          <h3>Balance</h3>
          <p class="balance">₹${balance.toLocaleString('en-IN')}</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${dataToExport.map(exp => {
            const date = new Date(exp.expense_date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            const type = exp.amount >= 0 ? "Income" : "Expense";
            const amountClass = exp.amount >= 0 ? "amount-positive" : "amount-negative";
            const sign = exp.amount >= 0 ? "+" : "-";
            const amount = Math.abs(exp.amount).toLocaleString('en-IN');
            
            return `
              <tr>
                <td>${date}</td>
                <td>${escapeHtml(exp.title)}</td>
                <td>${escapeHtml(exp.category) || "-"}</td>
                <td>${type}</td>
                <td class="${amountClass}">${sign}₹${amount}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This is a computer-generated report from Expense Tracker</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = function() {
    setTimeout(() => {
      printWindow.print();
      showToast("Opening print dialog for PDF export", "success");
    }, 250);
  };
}

function getFiltersHTML() {
  const hasFilters = filters.fromDate || filters.toDate || filters.categories.length > 0;
  
  if (!hasFilters) return '';
  
  let filterText = [];
  
  if (filters.fromDate && filters.toDate) {
    filterText.push(`Date Range: ${new Date(filters.fromDate).toLocaleDateString('en-IN')} to ${new Date(filters.toDate).toLocaleDateString('en-IN')}`);
  } else if (filters.fromDate) {
    filterText.push(`From Date: ${new Date(filters.fromDate).toLocaleDateString('en-IN')}`);
  } else if (filters.toDate) {
    filterText.push(`To Date: ${new Date(filters.toDate).toLocaleDateString('en-IN')}`);
  }
  
  if (filters.categories.length > 0) {
    filterText.push(`Categories: ${filters.categories.join(', ')}`);
  }
  
  return `
    <div class="filters-applied">
      <h4>⚠️ Filters Applied</h4>
      ${filterText.map(f => `<p>• ${f}</p>`).join('')}
    </div>
  `;
}

// ============= PROFILE MANAGEMENT =============

function toggleEdit() {
  const editSection = document.getElementById("edit-section");
  const nameInput = document.getElementById("profile-name");
  
  editSection.classList.toggle("hidden");
  
  if (!editSection.classList.contains("hidden")) {
    nameInput.focus();
  }
}

async function updateProfile() {
  const nameInput = document.getElementById("profile-name");
  const messageEl = document.getElementById("profile-message");
  const name = nameInput.value.trim();

  if (!name) {
    messageEl.innerText = "Name cannot be empty";
    messageEl.style.color = "var(--danger)";
    return;
  }

  if (name.length < 2) {
    messageEl.innerText = "Name must be at least 2 characters";
    messageEl.style.color = "var(--danger)";
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("profiles")
      .upsert({
        id: currentUser.id,
        name: name
      });

    if (error) {
      console.error("Update profile error:", error);
      messageEl.innerText = "Failed to update name";
      messageEl.style.color = "var(--danger)";
      return;
    }

    document.getElementById("welcome-text").innerText = `Welcome 👋 ${name}`;
    messageEl.innerText = "✓ Name updated successfully";
    messageEl.style.color = "var(--success)";

    setTimeout(() => {
      nameInput.value = "";
      messageEl.innerText = "";
      toggleEdit();
    }, 2000);

  } catch (error) {
    console.error("Update profile error:", error);
    messageEl.innerText = "Something went wrong";
    messageEl.style.color = "var(--danger)";
  }
}

// ============= LOGOUT =============

async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      showToast("Logout failed", "error");
      return;
    }

    showToast("Logged out successfully", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);

  } catch (error) {
    console.error("Logout error:", error);
    showToast("Something went wrong", "error");
  }
}

// ============= EXPENSE FORM =============

function toggleExpenseForm() {
  const section = document.getElementById("expense-section");
  const btn = document.getElementById("toggle-expense-btn");

  section.classList.toggle("hidden");

  if (section.classList.contains("hidden")) {
    btn.innerText = "➕ Add Expense / Income";
    document.getElementById("expense-form").reset();
  } else {
    btn.innerText = "❌ Close";
    document.getElementById("expense-title").focus();
  }
}

// ============= RENDER TABLE =============

function renderExpensesTable(data) {
  const tbody = document.getElementById("expense-body");
  tbody.innerHTML = "";

  if (data.length === 0) {
    const message = (filters.fromDate || filters.toDate || filters.categories.length > 0) 
      ? "No transactions found matching your filters"
      : "No transactions yet. Click 'Add Expense / Income' to get started!";
    
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem; opacity: 0.5;">
          ${message}
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((exp, index) => {
    const row = document.createElement("tr");
    row.style.animation = `slideUp 0.3s ease-out ${index * 0.05}s both`;

    const date = new Date(exp.expense_date);
    const formattedDate = date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });

    const formattedAmount = Math.abs(exp.amount).toLocaleString('en-IN');

    row.innerHTML = `
      <td data-label="Title">${escapeHtml(exp.title)}</td>
      <td data-label="Category">${escapeHtml(exp.category) || "-"}</td>
      <td data-label="Date">${formattedDate}</td>
      <td data-label="Amount" class="${exp.amount >= 0 ? "amount-positive" : "amount-negative"}">
        ${exp.amount >= 0 ? '+' : '-'}₹${formattedAmount}
      </td>
      <td data-label="Action">
        <button class="delete-btn" onclick="deleteTransaction('${exp.id}')" title="Delete transaction">
          🗑
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

// ============= ESCAPE HTML =============

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============= UPDATE TOTALS =============

function updateTotals(transactions) {
  let income = 0;
  let expense = 0;

  transactions.forEach(tx => {
    if (tx.amount > 0) {
      income += tx.amount;
    } else {
      expense += Math.abs(tx.amount);
    }
  });

  const balance = income - expense;

  document.getElementById("total-income").innerText = `₹${income.toLocaleString('en-IN')}`;
  document.getElementById("total-expense").innerText = `₹${expense.toLocaleString('en-IN')}`;
  document.getElementById("balance").innerText = `₹${balance.toLocaleString('en-IN')}`;
}

// ============= ADD EXPENSE =============

document.addEventListener("DOMContentLoaded", () => {
  initializeCategoryDropdown();
  
  const form = document.getElementById("expense-form");
  const submitBtn = document.getElementById("save-expense-btn");

  if (!form || !submitBtn) {
    console.error("Form or submit button not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (submitBtn.disabled) return;

    const titleInput = document.getElementById("expense-title");
    const amountInput = document.getElementById("expense-amount");
    const typeInput = document.getElementById("expense-type");
    const categoryInput = document.getElementById("expense-category");
    const dateInput = document.getElementById("expense-date");

    const title = titleInput.value.trim();
    let amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value || new Date().toISOString().split("T")[0];

    if (!title) {
      showToast("Please enter a title", "error");
      titleInput.focus();
      return;
    }

    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      amountInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Saving...";
    submitBtn.style.opacity = "0.7";

    try {
      if (type === "expense") {
        amount = -Math.abs(amount);
      } else {
        amount = Math.abs(amount);
      }

      const { data: userData, error: userError } = await supabaseClient.auth.getUser();

      if (userError || !userData?.user) {
        showToast("Session expired. Please login again.", "error");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
        return;
      }

      const { error } = await supabaseClient.from("expenses").insert([
        {
          user_id: userData.user.id,
          title,
          amount,
          category: category || null,
          expense_date: date,
        },
      ]);

      if (error) {
        console.error("Insert expense error:", error);
        showToast(error.message, "error");
        return;
      }

      showToast("Transaction saved successfully!", "success");
      
      form.reset();
      await loadExpensesAndTotals();

      setTimeout(() => {
        toggleExpenseForm();
      }, 1000);

    } catch (error) {
      console.error("Add expense error:", error);
      showToast("Something went wrong", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Add Transaction";
      submitBtn.style.opacity = "1";
    }
  });
});

// ============= DELETE TRANSACTION =============

async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      showToast("Failed to delete transaction", "error");
      return;
    }

    showToast("Transaction deleted successfully", "success");
    await loadExpensesAndTotals();

  } catch (error) {
    console.error("Delete error:", error);
    showToast("Something went wrong", "error");
  }
}

// ============= KEYBOARD SHORTCUTS =============

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    toggleExpenseForm();
  }

  if (e.key === "Escape") {
    const expenseSection = document.getElementById("expense-section");
    if (!expenseSection.classList.contains("hidden")) {
      toggleExpenseForm();
    }
    
    const filterSection = document.getElementById("filter-section");
    if (filterSection && !filterSection.classList.contains("hidden")) {
      toggleFilters();
    }
    
    const categoryDropdown = document.getElementById("category-dropdown");
    if (categoryDropdown && !categoryDropdown.classList.contains("hidden")) {
      categoryDropdown.classList.add("hidden");
    }
  }
});

// ============= AUTO-REFRESH =============

setInterval(() => {
  if (!isLoading && currentUser) {
    loadExpensesAndTotals();
  }
}, 5 * 60 * 1000);



