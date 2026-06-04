// ================= LOAD USERS =================
async function loadUsers() {
    const res = await fetch('/admin/users', {
        credentials: 'include'
    });

    const users = await res.json();

    let html = `
    <table>
        <tr>
            <th>Email</th>
            <th>Balance</th>
            <th>Action</th>
        </tr>
    `;

    users.forEach(u => {
        html += `
        <tr>
            <td>${u.email}</td>
            <td>₹${u.balance || 0}</td>
            <td>
                <button onclick="selectUser('${u._id}')">Select</button>
            </td>
        </tr>
        `;
    });

    html += `</table>`;

    document.getElementById('users').innerHTML = html;
}

function selectUser(id) {
    document.getElementById('userId').value = id;
}

// ================= ADD BALANCE =================
async function addBalance() {
    const userId = document.getElementById('userId').value;
    const amount = document.getElementById('amount').value;

    const res = await fetch('/admin/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, amount })
    });

    const data = await res.json();

    alert(data.message);
    loadUsers();
}

window.onload = loadUsers;