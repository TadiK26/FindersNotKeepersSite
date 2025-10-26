const API_URL = "http://localhost:5000"; // Flask backend URL
let accessToken = null;
let refreshToken = null;
let currentUserId = null;
let currentUsername = "";

// ===== REGISTER =====
async function register() {
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const role = document.getElementById("reg-role").value;

    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
    });

    const data = await res.json();

    if (res.ok) {
        document.getElementById("register-message").innerText = data.message;
        // Auto-login after registration
        document.getElementById("username").value = username;
        document.getElementById("password").value = password;
        await login(true);
    } else {
        document.getElementById("register-message").innerText = data.error || data.Error;
    }
}

// ===== LOGIN =====
async function login(auto = false) {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
        // accessToken = data.access_token;
        // refreshToken = data.refresh_token;
        // currentUsername = username;

        // after successful login
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        currentUsername = username;
        currentUserId = data.user_id; // you should return this from backend

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("currentUsername", currentUsername);
        localStorage.setItem("currentUserId", currentUserId);


        // TODO: ideally backend returns userID in login
        currentUserId = 1; 

        // Hide login/register
        document.getElementById("login-section").style.display = "none";
        document.getElementById("register-section").style.display = "none";

        // Show home
        document.getElementById("home-section").style.display = "block";
        document.getElementById("welcome-message").innerText = `Welcome, ${currentUsername}!`;

        showListings();
    } else {
        if (!auto) alert(data.message || "Login failed");
    }
}

// ===== LOGOUT =====
async function logout() {
    if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
    }

    accessToken = null;
    refreshToken = null;
    currentUserId = null;
    currentUsername = "";

    localStorage.clear(); // ✅ important

    document.getElementById("login-section").style.display = "block";
    document.getElementById("register-section").style.display = "block";
    document.getElementById("home-section").style.display = "none";
    document.getElementById("listings-section").style.display = "none";
}


// ===== LISTINGS =====
function showListings() {
    document.getElementById("listings-section").style.display = "block";
    getAllListings();
}

// Fetch only user's listings
async function getAllListings() {
    const res = await fetch(`${API_URL}/listings/`);
    const data = await res.json();
    const listEl = document.getElementById("listings-list");
    listEl.innerHTML = "";

    data.filter(l => l.user_id === currentUserId).forEach(l => {
        const li = document.createElement("li");
        li.textContent = `${l.title} - ${l.description} `;

        // Update button
        const updateBtn = document.createElement("button");
        updateBtn.textContent = "Update";
        updateBtn.onclick = () => {
            const newTitle = prompt("New Title", l.title);
            const newDesc = prompt("New Description", l.description);
            if (newTitle !== null && newDesc !== null) updateListing(l.id, newTitle, newDesc);
        };

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteListing(l.id);

        li.appendChild(updateBtn);
        li.appendChild(deleteBtn);
        listEl.appendChild(li);
    });
}

async function createListing() {
    const title = document.getElementById("new-title").value;
    const description = document.getElementById("new-desc").value;

    if (!title) return alert("Title required");

    const res = await fetch(`${API_URL}/listings/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ title, description, user_id: currentUserId })
    });

    const data = await res.json();
    if (res.ok) {
        document.getElementById("new-title").value = "";
        document.getElementById("new-desc").value = "";
        getAllListings();
    } else {
        alert(data.error || "Failed to create listing");
    }
}

async function updateListing(id, title, description) {
    const res = await fetch(`${API_URL}/listings/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ title, description })
    });
    if (res.ok) getAllListings();
    else alert("Update failed");
}

async function deleteListing(id) {
    const res = await fetch(`${API_URL}/listings/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${accessToken}` }
    });
    if (res.ok) getAllListings();
    else alert("Delete failed");
}

// ===== ABOUT PAGE =====
function goToAbout() {
    window.location.href = "about.html";
}




// ===== All your functions =====
// register(), login(), logout(), showListings(), getAllListings(), createListing(), updateListing(), deleteListing(), goToAbout() ...

// ===== Check if user is already logged in on page load =====
window.onload = () => {
    accessToken = localStorage.getItem("accessToken");
    refreshToken = localStorage.getItem("refreshToken");
    currentUsername = localStorage.getItem("currentUsername");
    currentUserId = parseInt(localStorage.getItem("currentUserId"));

    if (accessToken && currentUserId) {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("register-section").style.display = "none";
        document.getElementById("home-section").style.display = "block";
        document.getElementById("welcome-message").innerText = `Welcome, ${currentUsername}!`;
        showListings();
    }
};
