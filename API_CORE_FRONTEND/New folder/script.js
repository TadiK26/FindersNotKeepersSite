const form = document.getElementById('registerForm');
const messageEl = document.getElementById('message');

// Replace with your Flask API URL
const API_URL = 'http://127.0.0.1:5000/register'; 

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            messageEl.textContent = `Success: ${data.message || 'User registered!'}`;
            form.reset();
        } else {
            messageEl.textContent = `Error: ${data.error || data.message || res.status}`;
        }
    } catch (err) {
        console.error(err);
        messageEl.textContent = `Network error: ${err}`;
    }
});
