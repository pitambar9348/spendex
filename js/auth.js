// ============= UI HELPERS =============

function showSignIn() {
  document.getElementById("signin-form").classList.remove("hidden");
  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("signin-tab").classList.add("active");
  document.getElementById("signup-tab").classList.remove("active");
}

function showSignUp() {
  document.getElementById("signup-form").classList.remove("hidden");
  document.getElementById("signin-form").classList.add("hidden");
  document.getElementById("signup-tab").classList.add("active");
  document.getElementById("signin-tab").classList.remove("active");
}

function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "🙈";
  } else {
    input.type = "password";
    icon.textContent = "👁️";
  }
}

// ============= VALIDATION =============

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true };
}

function validateName(name) {
  if (name.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters" };
  }
  return { valid: true };
}

// ============= BUTTON LOADING STATE =============

function setButtonLoading(button, isLoading, loadingText = "Loading...") {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.style.opacity = "0.7";
    button.style.cursor = "not-allowed";
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
    button.style.opacity = "1";
    button.style.cursor = "pointer";
  }
}

// ============= SIGN UP =============

async function signUp() {
  const nameInput = document.getElementById("signup-name");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const button = event.target;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validation
  if (!name || !email || !password) {
    showToast("Please fill all fields", "error");
    return;
  }

  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    showToast(nameValidation.message, "error");
    return;
  }

  if (!validateEmail(email)) {
    showToast("Please enter a valid email", "error");
    return;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    showToast(passwordValidation.message, "error");
    return;
  }

  setButtonLoading(button, true, "Creating Account...");

  try {
    // Create auth user
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      if (error.message.includes("already registered")) {
        showToast("Email already registered. Please sign in.", "error");
        showSignIn();
      } else {
        showToast(error.message, "error");
      }
      return;
    }

    if (!data.user) {
      showToast("Please verify your email before signing in", "info");
      showSignIn();
      return;
    }

    // Create profile
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert([{
        id: data.user.id,
        name: name,              // ✅ use input name
        email: data.user.email
      }]);


    if (profileError) {
      console.error("Profile error:", profileError);
      showToast("Account created but profile setup failed", "error");
      return;
    }

    showToast("Account created successfully!", "success");

    nameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";

    setTimeout(() => showSignIn(), 1500);

  } catch (error) {
    console.error("Signup error:", error);
    showToast("Something went wrong", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

// ============= SIGN IN =============

async function signIn() {
  const emailInput = document.getElementById("signin-email");
  const passwordInput = document.getElementById("signin-password");
  const button = event.target;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }

  if (!validateEmail(email)) {
    showToast("Please enter a valid email", "error");
    return;
  }

  setButtonLoading(button, true, "Signing In...");

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        showToast("Invalid email or password", "error");
      } else {
        showToast(error.message, "error");
      }
      return;
    }

    showToast("Sign in successful!", "success");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 500);

  } catch (error) {
    console.error("Sign in error:", error);
    showToast("Something went wrong", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

// ============= FORGOT PASSWORD =============
const FORGOT_COOLDOWN = 60; // seconds

async function forgotPassword() {
  const emailInput = document.getElementById("signin-email");
  const email = emailInput.value.trim();
  const link = document.getElementById("forgot-link");

  if (!email) {
    showToast("Please enter your email first", "error");
    return;
  }

  if (!validateEmail(email)) {
    showToast("Please enter a valid email", "error");
    return;
  }

  try {
    // 🔍 Step 1: Check existence in profiles
    // const { data, error } = await supabaseClient
    //   .from("profiles")
    //   .select("id")
    //   .eq("email", email)
    //   .maybeSingle();

    // if (error) {
    //   showToast("Something went wrong", "error");
    //   return;
    // }
    const lastSent = localStorage.getItem("forgotCooldown");
    const now = Date.now();

    if (lastSent && now - lastSent < FORGOT_COOLDOWN * 1000) {
      const remaining = Math.ceil(
        (FORGOT_COOLDOWN * 1000 - (now - lastSent)) / 1000
      );
      showToast(`Please wait ${remaining}s before retrying`, "info");
      return;
    }

    // 🔒 Disable link immediately
    link.style.pointerEvents = "none";
    link.style.opacity = "0.5";

    // 🔐 Step 2: Send reset email
    const { error: resetError } =
      await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `https://guileless-horse-b8525b.netlify.app/reset-password.html`,
      });

    if (resetError) {
      showToast(resetError.message, "error");
      return;
    }

    showToast("If this email exists, a reset link has been sent", "success");

    localStorage.setItem("forgotCooldown", Date.now());

    // ⏳ Re-enable after cooldown
    let remaining = FORGOT_COOLDOWN;
    const interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        link.style.pointerEvents = "auto";
        link.style.opacity = "1";
        localStorage.removeItem("forgotCooldown");
      }
    }, 1000);

  } catch (err) {
    console.error(err);
    showToast("Something went wrong", "error");
  }
}


// ============= ENTER KEY SUPPORT =============

document.addEventListener("DOMContentLoaded", () => {
  const signinEmail = document.getElementById("signin-email");
  const signinPassword = document.getElementById("signin-password");

  if (signinEmail && signinPassword) {
    [signinEmail, signinPassword].forEach(input => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          signIn();
        }
      });
    });
  }

  const signupInputs = ["signup-name", "signup-email", "signup-password"];
  signupInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          signUp();
        }
      });
    }
  });
});

