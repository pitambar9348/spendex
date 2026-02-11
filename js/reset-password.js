// ============= PASSWORD RESET =============

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get session from URL hash
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      showToast("Invalid or expired reset link", "error");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
      return;
    }

    if (!data.session) {
      showToast("No active recovery session", "error");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
      return;
    }

    console.log("Recovery session active");
    showToast("Please enter your new password", "info");

  } catch (error) {
    console.error("Reset page load error:", error);
    showToast("Something went wrong", "error");
  }
});

async function updatePassword() {
  const passwordInput = document.getElementById("new-password");
  const password = passwordInput.value.trim();
  const button = event?.target;

  // Validation
  if (!password) {
    showToast("Password cannot be empty", "error");
    passwordInput.focus();
    return;
  }

  if (!validatePassword(password).valid) {
    showToast("Password must be at least 6 characters", "error");
    passwordInput.focus();
    return;
  }
  
  if (password.length < 6) {
    showToast("Weak password", "error");
    passwordInput.focus();
    return;
  }

  // Set loading state
  if (button) {
    button.disabled = true;
    button.textContent = "Updating...";
    button.style.opacity = "0.7";
  }

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: password
    });

    if (error) {
      console.error("Update password error:", error);
      showToast(error.message, "error");
      return;
    }

    showToast("Password updated successfully!", "success");

    // Redirect to sign in
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (error) {
    console.error("Update password error:", error);
    showToast("Something went wrong", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Update Password";
      button.style.opacity = "1";
    }
  }
}

// ============= ENTER KEY SUPPORT =============

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("new-password");

  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        updatePassword();
      }
    });
  }
});
