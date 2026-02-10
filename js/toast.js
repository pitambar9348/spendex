// ============= TOAST NOTIFICATION SYSTEM =============

let toastTimeout;
let toastQueue = [];
let isShowingToast = false;

function showToast(message, type = "info", duration = 3000) {
  // Add to queue
  toastQueue.push({ message, type, duration });
  
  // Process queue if not already showing
  if (!isShowingToast) {
    processToastQueue();
  }
}

function processToastQueue() {
  if (toastQueue.length === 0) {
    isShowingToast = false;
    return;
  }

  isShowingToast = true;
  const { message, type, duration } = toastQueue.shift();

  const toast = document.getElementById("toast");
  
  if (!toast) {
    console.error("Toast element not found");
    isShowingToast = false;
    return;
  }

  // Clear any existing timeout
  clearTimeout(toastTimeout);

  // Set toast content and style
  toast.className = `toast show ${type}`;
  toast.innerText = message;

  // Add icon based on type
  const icons = {
    success: "✓ ",
    error: "✕ ",
    info: "ℹ ",
    warning: "⚠ "
  };
  
  toast.innerText = (icons[type] || "") + message;

  // Auto-hide after duration
  toastTimeout = setTimeout(() => {
    hideToast();
  }, duration);
}

function hideToast() {
  const toast = document.getElementById("toast");
  
  if (toast) {
    toast.className = "toast hidden";
  }

  // Process next toast in queue after animation
  setTimeout(() => {
    isShowingToast = false;
    processToastQueue();
  }, 300);
}

// ============= MANUAL DISMISS =============

document.addEventListener("DOMContentLoaded", () => {
  const toast = document.getElementById("toast");
  
  if (toast) {
    // Click to dismiss
    toast.addEventListener("click", () => {
      hideToast();
    });

    // Make toast cursor pointer
    toast.style.cursor = "pointer";
  }
});

// ============= GLOBAL ERROR HANDLER =============

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  // Optionally show toast for critical errors
  // showToast("An unexpected error occurred", "error");
});

// ============= PROMISE REJECTION HANDLER =============

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Optionally show toast
  // showToast("Something went wrong", "error");
});