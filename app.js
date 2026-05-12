const API = '/api';
let currentUser = null;
let selectedUser = null;

// Показать экран
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Регистрация
async function register() {
    const username = document.getElementById('reg-username')?.value.trim();
    const password = document.getElementById('reg-password')?.value.trim();
    const err = document.getElementById('reg-error');
    
    if (!username || !password) {
        err.textContent = 'Заполните все поля';
        return;
    }
    
    try {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();
        
        if (!res.ok) {
            err.textContent = data.error;
        } else {
            err.style.color = 'green';
            err.textContent = 'Успешно!';
            setTimeout(() => showScreen('login-screen'), 1000);
        }
    } catch(e) {
        err.textContent = 'Ошибка сервера';
    }
}

// Вход
async function login() {
    const username = document.getElementById('login-username')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();
    const err = document.getElementById('login-error');
    
    if (!username || !password) {
        err.textContent = 'Заполните все поля';
        return;
    }
    
    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();
        
        if (!res.ok) {
            err.textContent = data.error;
        } else {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showScreen('chat-screen');
            loadUsers();
        }
    } catch(e) {
        err.textContent = 'Ошибка сервера';
    }
}

// Загрузка пользователей
async function loadUsers() {
    try {
        const res = await fetch(`${API}/users`);
        const users = await res.json();
        const list = document.getElementById('users-list');
        if (!list) return;
        
        list.innerHTML = '';
        users.forEach(u => {
            if (u.username !== currentUser.username) {
                const div = document.createElement('div');
                div.className = 'user-item';
                div.textContent = u.username;
                div.onclick = () => selectChat(u.username);
                list.appendChild(div);
            }
        });
        
        document.getElementById('my-username').textContent = currentUser.username;
    } catch(e) {
        console.error(e);
    }
}

// Выбор чата
function selectChat(username) {
    selectedUser = username;
    document.getElementById('chat-partner').textContent = 'Чат с ' + username;
    document.getElementById('msg-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    loadMessages();
}

// Загрузка сообщений
async function loadMessages() {
    if (!selectedUser) return;
    
    try {
        const res = await fetch(`${API}/messages?user1=${currentUser.username}&user2=${selectedUser}`);
        const msgs = await res.json();
        const container = document.getElementById('messages');
        if (!container) return;
        
        container.innerHTML = '';
        msgs.forEach(m => {
            const div = document.createElement('div');
            div.className = 'msg ' + (m.from_user === currentUser.username ? 'sent' : 'received');
            div.innerHTML = `<div class="msg-bubble">${m.text}<br><small>${m.time}</small></div>`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    } catch(e) {
        console.error(e);
    }
}

// Отправка сообщения
async function sendMsg() {
    const input = document.getElementById('msg-input');
    const text = input?.value.trim();
    if (!text || !selectedUser) return;
    
    try {
        await fetch(`${API}/messages`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                from_user: currentUser.username,
                to_user: selectedUser,
                text: text,
                time: new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})
            })
        });
        
        input.value = '';
        loadMessages();
    } catch(e) {
        console.error(e);
    }
}

// Выход
function logout() {
    currentUser = null;
    selectedUser = null;
    localStorage.removeItem('user');
    showScreen('login-screen');
}

// Автообновление сообщений
setInterval(() => {
    if (selectedUser) loadMessages();
}, 3000);

// Enter для отправки
document.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        if (document.getElementById('login-screen').classList.contains('active')) login();
        else if (document.getElementById('register-screen').classList.contains('active')) register();
        else if (document.getElementById('chat-screen').classList.contains('active')) sendMsg();
    }
});

// Проверка сессии при загрузке
const saved = localStorage.getItem('user');
if (saved) {
    currentUser = JSON.parse(saved);
    showScreen('chat-screen');
    loadUsers();
}
