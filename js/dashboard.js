// ==============================
// Supabase Client Initialization
// ==============================
const supabaseClient = supabase.createClient(
  "https://jkynrslsfqwhsvrgzmle.supabase.co", // Your Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreW5yc2xzZnF3aHN2cmd6bWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MzMyNDQsImV4cCI6MjA3MzQwOTI0NH0.HEuMyMWchJYIKH3XGhXavpfmDrdiQeChMyk1WG13C8g" // Your anon key
);

// ==============================
// DOM Elements
// ==============================
const tasksTableBody = document.getElementById("tasks-table-body");
const addTaskBtn = document.getElementById("add-task-btn");
const qrModal = document.getElementById("qr-modal");
const qrCodeContainer = document.getElementById("qr-code-container");
const closeQrModalBtn = document.getElementById("close-qr-modal");
const downloadQrBtn = document.getElementById("download-qr-btn");
const notificationsList = document.getElementById("notifications-list");
const logoutBtn = document.getElementById("logout-btn");

// ==============================
// Fetch & Render Tasks
// ==============================
async function fetchTasks() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error("Error fetching tasks:", error);

  tasksTableBody.innerHTML = "";

  data.forEach(task => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-100";

    tr.innerHTML = `
      <td class="p-3">${task.title}</td>
      <td class="p-3">${task.assigned_person}</td>
      <td class="p-3">${task.lab_number}</td>
      <td class="p-3">
        <span class="px-2 py-1 rounded-full ${
          task.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
        } text-sm font-semibold">${task.status}</span>
      </td>
      <td class="p-3 text-center">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg font-medium text-sm generate-qr-btn" data-id="${task.task_id}">QR</button>
      </td>
      <td class="p-3 text-center">
        <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium text-sm delete-btn" data-id="${task.task_id}">Delete</button>
      </td>
    `;

    tasksTableBody.appendChild(tr);
  });

  attachTaskEvents();
}

// ==============================
// Attach QR & Delete Events
// ==============================
function attachTaskEvents() {
  // QR buttons
  document.querySelectorAll(".generate-qr-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const taskId = btn.getAttribute("data-id")?.trim();
      if (!taskId) return;

      const { data: task, error } = await supabaseClient.from("tasks").select("*").eq("task_id", taskId).single();
      if (error || !task) return alert("Error fetching task");

      qrCodeContainer.innerHTML = "";
      const qrCanvas = document.createElement("canvas");
      qrCodeContainer.appendChild(qrCanvas);

      const qrText = `Task: ${task.title}\nAssigned To: ${task.assigned_person}\nLab: ${task.lab_number}\nStatus: ${task.status}`;
      QRCode.toCanvas(qrCanvas, qrText, { width: 180 }, err => {
        if (err) console.error(err);
      });

      downloadQrBtn.href = qrCanvas.toDataURL();
      downloadQrBtn.download = `${task.title}_QR.png`;
      qrModal.classList.remove("hidden");
      downloadQrBtn.classList.remove("hidden");
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const taskId = btn.getAttribute("data-id")?.trim();
      if (!taskId) return alert("Invalid task ID");

      if (!confirm("Are you sure you want to delete this task?")) return;

      console.log("Deleting task ID:", taskId);

      const { data, error } = await supabaseClient.from("tasks").delete().eq("task_id", taskId);
      console.log("Delete response:", data, error);

      if (error) return alert("Failed to delete task: " + error.message);
      if (!data || data.length === 0) return alert("No task found with this ID!");

      addNotification(`Task deleted successfully: ${taskId}`);
      fetchTasks();
    });
  });
}

// ==============================
// Close QR Modal
// ==============================
closeQrModalBtn.addEventListener("click", () => {
  qrModal.classList.add("hidden");
});

// ==============================
// Add Task
// ==============================
addTaskBtn.addEventListener("click", async () => {
  const title = document.getElementById("task-title").value.trim();
  const desc = document.getElementById("task-desc").value.trim();
  const assigned_person = document.getElementById("task-person").value.trim();
  const lab_number = document.getElementById("task-lab").value.trim();
  const status = document.getElementById("task-status").value;

  if (!title || !assigned_person || !lab_number) return alert("Please fill in all required fields");

  const { error } = await supabaseClient.from("tasks").insert([{ title, description: desc, assigned_person, lab_number, status }]);
  if (error) return alert("Failed to add task: " + error.message);

  document.getElementById("task-title").value = "";
  document.getElementById("task-desc").value = "";
  document.getElementById("task-person").value = "";
  document.getElementById("task-lab").value = "";
  document.getElementById("task-status").value = "Pending";

  addNotification(`New task added: ${title}`);
  fetchTasks();
});

// ==============================
// Notifications
// ==============================
function addNotification(message) {
  const li = document.createElement("li");
  li.className = "bg-blue-100 text-blue-800 p-2 sm:p-3 rounded-lg shadow-sm";
  li.textContent = message;
  notificationsList.prepend(li);
}

// ==============================
// Logout
// ==============================
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) alert("Logout failed: " + error.message);
    else window.location.href = "index.html";
  });
}

// ==============================
// Initial Load
// ==============================
fetchTasks();
