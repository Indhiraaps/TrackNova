// ==============================
// Supabase Client
// ==============================
const SUPABASE_URL = "https://jkynrslsfqwhsvrgzmle.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreW5yc2xzZnF3aHN2cmd6bWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MzMyNDQsImV4cCI6MjA3MzQwOTI0NH0.HEuMyMWchJYIKH3XGhXavpfmDrdiQeChMyk1WG13C8g";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// DOM Elements
// ==============================
const loginForm = document.getElementById("login-form");

// ==============================
// Password Regex Constraint
// ==============================
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ==============================
// Login Form Submit
// ==============================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    return alert("Please fill in all fields.");
  }

  if (!passwordRegex.test(password)) {
    return alert(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    );
  }

  try {
    // Try signing in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    alert("Login successful! Welcome " + name);

    // Redirect to your main item page/dashboard
    window.location.href = "item.html";
  } catch (err) {
    console.error(err);
    alert("An unexpected error occurred during login.");
  }
});
