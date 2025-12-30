// js/supabase.js

// Import createClient from the CDN bundle
const { createClient } = supabase;

// --- Supabase Project Config ---
// Replace with your project details
const SUPABASE_URL = "https://jkynrslsfqwhsvrgzmle.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreW5yc2xzZnF3aHN2cmd6bWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MzMyNDQsImV4cCI6MjA3MzQwOTI0NH0.HEuMyMWchJYIKH3XGhXavpfmDrdiQeChMyk1WG13C8g";

// --- Create Client ---
// Attach to window so it’s available everywhere
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Service Layer ---
// All DB calls wrapped in helper functions
window.SupabaseService = {
  // Add new admin (signup)
  async addAdmin(name, email, password) {
    return await window.supabaseClient
      .from("admin")
      .insert([{ name, email, password }])
      .select();
  },

  // Get admin by email + password (login)
  async getAdmin(email, password) {
    return await window.supabaseClient
      .from("admin")
      .select("*")
      .eq("email", email)
      .eq("password", password) // ⚠️ for demo only
      .maybeSingle();
  },

  // Fetch all admins (optional)
  async fetchAdmins() {
    return await window.supabaseClient.from("admin").select("*");
  },
};
