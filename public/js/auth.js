// ================= LOGIN =================
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.message) {
        alert("Login success ✅");
        window.location.href = "/flights.html";
    } else {
        alert(data.error || "Login failed ❌");
    }
}

// ================= LOAD USER =================
async function loadUser() {
    try {
        const res = await fetch('/auth/me', {
            credentials: 'include'
        });

        const user = await res.json();

        console.log("USER:", user);

        document.getElementById('userName').innerText = user.name;
        document.getElementById('balance').innerText = user.balance;

    } catch (err) {
        console.log("ERROR:", err);
    }
}

// ================= LOGOUT =================
function logout() {
    window.location.href = "/logout";
}
window.onload = loadUser;