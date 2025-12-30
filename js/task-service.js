// Import the Supabase client and user utility functions from the client module
import { 
    supabase, 
    getCurrentUserEmail, 
    getCurrentUserId
} from './supabase-client.js';

// ====================================================================
// --- LOGGING SERVICE ---
// ====================================================================

/**
 * Logs an activity into the 'activity_log' table.
 * @param {string} action - The type of action (e.g., "Task Created").
 * @param {string} details - A detailed description of the action.
 * @param {string} userEmail - The email of the admin/user performing the action.
 * @param {string|null} userId - The ID (UUID) of the admin/user performing the action.
 * @param {string|null} taskId - The ID (UUID) of the task associated with the action.
 * @returns {Promise<boolean>} True if logging was successful, false otherwise.
 */
export async function logActivity(action, details, userEmail, userId = null, taskId = null) {
    if (!userEmail) {
        console.error("Cannot log activity: userEmail is null or undefined.");
        return false;
    }

    // Ensure taskId is explicitly null if falsy, as expected by Supabase schema
    const sanitizedTaskId = taskId || null; 

    const { error } = await supabase
        .from('activity_log')
        .insert({
            action: action,
            details: details,
            sender_email: userEmail, 
            task_id: sanitizedTaskId,
            user_id: userId,
        });

    if (error) {
        console.error("Error logging activity:", error);
        return false;
    }
    return true;
}

// ====================================================================
// --- TASK CRUD OPERATIONS ---
// ====================================================================

/**
 * Fetches all tasks from the database, ordered by newest first.
 * @returns {Promise<{ data: Array<object>, error: object | null }>}
 */
export async function getTasks() {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        return { data: [], error }; 
    }
    return { data, error: null };
}

/**
 * Fetches a single task by its unique ID.
 * @param {string} taskId - The ID (UUID) of the task to fetch.
 * @returns {Promise<{ task: object | null, error: object | null }>}
 */
export async function getTaskById(taskId) {
    const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        // Assuming 'task_id' is your primary key column name.
        .eq('task_id', taskId) 
        .single(); // Use .single() to return an object instead of an array

    if (error) {
        console.error('Error fetching single task:', error);
        return { task: null, error }; 
    }
    return { task, error: null };
}

/**
 * Adds a new task to the database and logs the activity.
 * @param {object} taskData - The data for the new task (title, description, assigned_person, etc.).
 * @param {string} userEmail - The email of the admin/user creating the task.
 * @param {string} userId - The ID (UUID) of the admin/user creating the task.
 * @returns {Promise<{ success: boolean, task: object | null, error: object | null }>}
 */
export async function addTask(taskData, userEmail, userId) {
    // 1. Insert Task
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            title: taskData.title,
            description: taskData.description || null,
            assigned_person: taskData.assigned_person,
            location: taskData.location, 
            priority: taskData.priority,
            status: 'Pending', 
            creator_email: userEmail, 
        })
        .select(); // Request the newly created record back

    if (error) {
        console.error('Error adding task:', error);
        return { success: false, task: null, error };
    }

    // 2. Log the activity
    const newTask = data[0];
    // Use the primary key returned by the insert operation
    const newTaskId = newTask?.task_id || newTask?.id; 
    
    if (newTaskId) {
        const logDetails = `Task "${newTask.title}" created and assigned to ${newTask.assigned_person}.`;
        await logActivity('Task Created', logDetails, userEmail, userId, newTaskId);
    }

    return { success: true, task: newTask, error: null };
}

/**
 * Deletes a task and logs the activity (Logging should be handled by the caller, 
 * which has the task's title/details before deletion).
 * @param {string} taskId - The ID of the task to delete.
 * @returns {Promise<boolean>} True if successful, throws an error otherwise.
 */
export const deleteTask = async (taskId) => {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('task_id', taskId); 

        if (error) {
            console.error("Supabase Error deleting task:", error);
            throw new Error(error.message || "Failed to delete task.");
        }
        
        // Logging for deletion should be done in dashboard-ui.js
        // because we need the task's title *before* the deletion query runs.
        
        return true; 
        
    } catch (err) {
        console.error("Error deleting task:", err.message || err); 
        throw err;
    }
};


/**
 * Updates an existing task and logs the activity.
 * @param {string} taskId - The ID (UUID) of the task to update.
 * @param {object} updateData - The data object containing fields to update.
 * @param {string} userEmail - The email of the user performing the update.
 * @param {string} userId - The ID (UUID) of the user performing the update.
 * @param {string} oldStatus - The task's status before the update for logging purposes.
 * @returns {Promise<{ success: boolean, task: object | null, error: object | null }>}
 */
export async function updateTask(taskId, updateData, userEmail, userId, oldStatus) {
    // 1. Update Task
    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        // CRUCIAL: Filtering by the correct column name 'task_id'
        .eq('task_id', taskId) 
        .select();

    if (error) {
        console.error('Error updating task:', error);
        return { success: false, task: null, error };
    }

    // 2. Log the activity
    const newTask = data[0];
    let logDetails;
    
    // Customize log detail if the status field was the only/major change
    if (newTask.status && newTask.status !== oldStatus) {
        logDetails = `Task "${newTask.title}" status changed from "${oldStatus}" to "${newTask.status}".`;
    } else {
        logDetails = `Task "${newTask.title}" updated. Fields changed.`;
    }
    
    await logActivity('Task Updated', logDetails, userEmail, userId, taskId);
    
    return { success: true, task: newTask, error: null };
}

// ====================================================================
// --- HISTORY SERVICE ---
// ====================================================================

/**
 * Fetches all activity log entries, ordered by newest first.
 * @returns {Promise<{ data: Array<object>, error: object | null }>}
 */
export async function getActivityHistory() {
    const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching activity history:', error);
        return { data: [], error }; 
    }
    return { data, error: null };
}


// ====================================================================
// --- TECHNICIAN SERVICE (Fallback) ---
// ====================================================================

/**
 * Fetches a list of all distinct assigned people's names from the 'tasks' table.
 * @returns {Promise<{ data: Array<{ name: string }>, error: object | null }>}
 */
export async function getAssignedTechnicians() {
    // Selects only the assigned_person column, ensuring only distinct values are returned
    const { data, error } = await supabase
        .from('tasks')
        .select('assigned_person', { distinct: true });

    if (error) {
        console.error('Error fetching distinct assigned people:', error);
        return { data: [], error };
    }
    
    // Transform the result into the expected array of objects: [{ name: 'Name 1' }, ...]
    const names = data
        // 💡 IMPROVEMENT: Filter out any null/empty entries from the database
        .filter(item => item.assigned_person) 
        .map(item => item.assigned_person)
        .filter(name => name) // Ensure the name itself isn't falsy (e.g., empty string)
        .map(name => ({ name: name })); 

    return { data: names, error: null };
}