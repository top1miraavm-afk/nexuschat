const API = 'http://localhost:3000/api';
let selectedUser = null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  setInterval(loadDashboard, 5000);
});

async function loadDashboard() {
  await loadStats();
  await loadUsers();
}

async function loadStats() {
  try {
    const [usersRes, messagesRes] = await Promise.all([
      fetch(`${API}/users`),
      fetch(`${API}/admin/messages`)
    ]);

    const users = await usersRes.json();
    const messages = await messagesRes.json();

    document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${users.length}</div>
                <div class="stat-label">Всего пользователей</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💬</div>
                <div class="stat-value">${messages.length}</div>
                <div class="stat-label">Всего сообщений</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🟢</div>
                <div class="stat-value">${users.length}</div>
                <div class="stat-label">Активных пользователей</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">${new Date().toLocaleDateString('ru-RU')}</div>
                <div class="stat-label">Сегодня</div>
            </div>
        `;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${API}/users`);
    const users = await response.json();

    const usersDiv = document.getElementById('admin-users');
    usersDiv.innerHTML = users.map(user => `
            <div class="admin-user-card ${selectedUser === user.username ? 'active' : ''}"
                 onclick="selectUser('${user.username}')">
                <div class="user-avatar">${user.username[0].toUpperCase()}</div>
                <div style="flex: 1;">
                    <strong>${user.username}</strong>
                    <div style="font-size: 12px; color: #94a3b8;">
                        ${new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </div>
                </div>
            </div>
        `).join('');
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
  }
}

async function selectUser(username) {
  selectedUser = username;
  await loadUsers();
  await loadUserChats(username);
}

async function loadUserChats(username) {
  try {
    const response = await fetch(`${API}/admin/user-chats/${username}`);
    const data = await response.json();

    const chatsView = document.getElementById('chats-view');

    if (!data.chats || Object.keys(data.chats).length === 0) {
      chatsView.innerHTML = `
                <p style="text-align: center; color: #94a3b8; padding: 40px;">
                    <i class="fas fa-inbox" style="font-size: 50px; display: block; margin-bottom: 15px; opacity: 0.3;"></i>
                    У пользователя нет переписок
                </p>
            `;
      return;
    }

    let html = `<h3>💬 Переписки: <span style="color: #f59e0b;">${username}</span></h3>`;

    for (const [partner, messages] of Object.entries(data.chats)) {
      html += `
                <div class="chat-section">
                    <div class="chat-section-header">
                        <span>📱 Чат с ${partner}</span>
                        <span style="font-size: 13px;">${messages.length} сообщ.</span>
                    </div>
                    ${messages.map(msg => `
                        <div class="admin-message-item">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <strong style="color: ${msg.from_user === username ? '#6366f1' : '#10b981'};">
                                    ${msg.from_user === username ? '📤 Отправлено' : '📥 Получено'}
                                </strong>
                                <span style="color: #94a3b8; font-size: 12px;">🕒 ${msg.time}</span>
                            </div>
                            <div>${escapeHtml(msg.text)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
    }

    chatsView.innerHTML = html;
  } catch (error) {
    console.error('Ошибка загрузки чатов:', error);
  }
}

async function deleteChat(user1, user2) {
  if (confirm(`Удалить переписку между ${user1} и ${user2}?`)) {
    try {
      await fetch(`${API}/admin/delete-chat`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1, user2 })
      });

      if (selectedUser) {
        await loadUserChats(selectedUser);
      }
      await loadStats();
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
