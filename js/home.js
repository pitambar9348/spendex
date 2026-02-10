// ============= GLOBAL STATE =============

let currentUser = null;
let allExpenses = [];
let isLoading = false;

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

    // Load profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile load error:", profileError);
    }

    // Update welcome message
    const welcomeText = document.getElementById("welcome-text");
    welcomeText.innerText = profile?.name 
      ? `Welcome 👋 ${profile.name}` 
      : "Welcome 👋";

    // Load all data
    await loadExpensesAndTotals();

  } catch (error) {
    console.error("Load user error:", error);
    showToast("Failed to load user data", "error");
  }
}

loadUser();

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
    renderExpensesTable(allExpenses);
    updateTotals(allExpenses);

  } catch (error) {
    console.error("Load expenses error:", error);
    showToast("Something went wrong", "error");
  } finally {
    isLoading = false;
  }
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

    // Update UI immediately
    document.getElementById("welcome-text").innerText = `Welcome 👋 ${name}`;
    messageEl.innerText = "✓ Name updated successfully";
    messageEl.style.color = "var(--success)";

    // Clear input and hide editor
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
    // Focus first input
    document.getElementById("expense-title").focus();
  }
}

// ============= RENDER TABLE =============

function renderExpensesTable(data) {
  const tbody = document.getElementById("expense-body");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem; opacity: 0.5;">
          No transactions yet. Click "Add Expense / Income" to get started!
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((exp, index) => {
    const row = document.createElement("tr");
    row.style.animation = `slideUp 0.3s ease-out ${index * 0.05}s both`;

    // Format date
    const date = new Date(exp.expense_date);
    const formattedDate = date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });

    // Format amount with commas
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

  // Format with commas
  document.getElementById("total-income").innerText = `₹${income.toLocaleString('en-IN')}`;
  document.getElementById("total-expense").innerText = `₹${expense.toLocaleString('en-IN')}`;
  document.getElementById("balance").innerText = `₹${balance.toLocaleString('en-IN')}`;
}

// ============= ADD EXPENSE =============

document.addEventListener("DOMContentLoaded", () => {
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

    // Validation
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

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerText = "Saving...";
    submitBtn.style.opacity = "0.7";

    try {
      // Adjust amount based on type
      if (type === "expense") {
        amount = -Math.abs(amount);
      } else {
        amount = Math.abs(amount);
      }

      // Verify user session
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();

      if (userError || !userData?.user) {
        showToast("Session expired. Please login again.", "error");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
        return;
      }

      // Insert expense
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
      
      // Reset form
      form.reset();
      
      // Reload data
      await loadExpensesAndTotals();

      // Close form after delay
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
  // Ctrl/Cmd + K to toggle expense form
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    toggleExpenseForm();
  }

  // Escape to close expense form
  if (e.key === "Escape") {
    const expenseSection = document.getElementById("expense-section");
    if (!expenseSection.classList.contains("hidden")) {
      toggleExpenseForm();
    }
  }
});

// ============= AUTO-REFRESH =============

// Optional: Auto-refresh data every 5 minutes
setInterval(() => {
  if (!isLoading && currentUser) {
    loadExpensesAndTotals();
  }
}, 5 * 60 * 1000);