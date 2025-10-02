// js/admin.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const showSignup = document.getElementById("show-signup");
  const showLogin = document.getElementById("show-login");

  // Toggle forms
  showSignup.addEventListener("click", () => {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
  });

  showLogin.addEventListener("click", () => {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
  });

  // --- Signup ---
  document.getElementById("signup-btn").addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
      alert("⚠️ Please fill in all fields");
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("admin")
        .insert([{ name, email, password }]) // 👈 for demo only (not secure!)
        .select();

      if (error) {
        alert("❌ Signup failed: " + error.message);
        console.error(error);
      } else {
        alert("🎉 Signup successful! Please login.");
        // Switch to login form
        signupForm.classList.remove("active");
        loginForm.classList.add("active");

        // Clear fields
        document.getElementById("name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
      }
    } catch (err) {
      alert("⚠️ Unexpected error: " + err.message);
      console.error(err);
    }
  });

  // --- Login ---
  document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      alert("⚠️ All fields are required!");
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("admin")
        .select("*")
        .eq("email", email)
        .eq("password", password) // 👈 for demo only (not secure!)
        .single();

      if (error || !data) {
        alert("❌ Invalid credentials!");
        console.warn(error);
      } else {
        // Save session in localStorage
        localStorage.setItem("admin", JSON.stringify(data));
        alert("🎉 Login successful!");
        window.location.href = "dashboard.html";
      }
    } catch (err) {
      alert("⚠️ Login failed: " + err.message);
      console.error(err);
    }
  });
});
