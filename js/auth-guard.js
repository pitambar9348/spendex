// ============= AUTH GUARD =============

async function requireAuth() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("Auth check error:", error);
      redirectToLogin();
      return;
    }

    if (!user) {
      redirectToLogin();
      return;
    }

    // Session is valid
    return true;

  } catch (error) {
    console.error("Auth guard error:", error);
    redirectToLogin();
  }
}

function redirectToLogin() {
  // Store current page for redirect after login
  sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
  window.location.href = "index.html";
}

// ============= SESSION MONITORING =============

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "index.html";
  }
  
  if (event === "TOKEN_REFRESHED") {
    console.log("Session refreshed");
  }

  if (event === "USER_UPDATED") {
    console.log("User updated");
  }
});

// ============= INACTIVITY TIMEOUT =============

let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  
  inactivityTimer = setTimeout(async () => {
    // Check if user is still active
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
      // Refresh session
      await supabaseClient.auth.refreshSession();
    }
  }, INACTIVITY_TIMEOUT);
}

// Track user activity
if (typeof document !== 'undefined') {
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
  
  // Start timer
  resetInactivityTimer();
}