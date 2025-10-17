let chatCode = "";
let chatKey = "";
let myRole = "";
let myName = "";
let refreshInterval;
let selectedFile = null;

function createChat() {
  const newCode = document.getElementById("newCode").value;
  const newKey = document.getElementById("newKey").value;
  if (!newCode || !newKey) {
    alert("Ingresa código y clave para el nuevo chat");
    return;
  }

  fetch("/api/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatCode: newCode, chatKey: newKey })
  })
  .then(async res => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw body;
    alert("Chat creado correctamente. Ahora puedes ingresar con el código y la clave.");
    document.getElementById("chatCode").value = newCode;
    document.getElementById("chatKey").value = newKey;
    document.getElementById("newCode").value = "";
    document.getElementById("newKey").value = "";
  })
  .catch(err => {
    alert(err.error || "Error al crear el chat");
    console.error(err);
  });
}

function enterChat() {
  chatCode = document.getElementById("chatCode").value;
  chatKey = document.getElementById("chatKey").value;
  if (!chatCode || !chatKey) {
    alert("Debes ingresar un código y una clave.");
    return;
  }
  myName = prompt("Ingresa tu nombre o alias:");
  if (!myName || !myName.trim()) {
    alert("Se requiere un nombre para ingresar.");
    return;
  }

  const enterButton = document.querySelector('section:nth-child(2) .btn');
  enterButton.disabled = true;
  enterButton.textContent = 'Ingresando...';

  fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatCode, chatKey, name: myName })
  })
  .then(async res => {
    const responseText = await res.text();
    if (!res.ok) {
      try {
        const errorJson = JSON.parse(responseText);
        throw errorJson;
      } catch (e) {
        throw new Error(`Error ${res.status}: ${responseText}`);
      }
    }
    return JSON.parse(responseText);
  })
  .then(data => {
    myRole = data.role;
    document.getElementById("chatContainer").style.display = "block";
    const rb = document.getElementById("myRoleDisplay");
    if (rb) {
      rb.textContent = `Rol: ${myRole}`;
      rb.style.display = "inline-block";
    }

    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(refreshMessages, 3000);
    refreshMessages();
  })
  .catch(err => {
    const errorMessage = err.error || err.message || "Error desconocido al ingresar al chat.";
    alert(errorMessage);
    console.error("Error al ingresar:", err);
  })
  .finally(() => {
    enterButton.disabled = false;
    enterButton.textContent = 'Entrar';
  });
}

function sendMessage() {
  const text = document.getElementById("messageInput").value;
  if (!text && !selectedFile) return;

  const formData = new FormData();
  formData.append("chatCode", chatCode);
  formData.append("chatKey", chatKey);
  formData.append("role", myRole);
  formData.append("text", text);
  if (selectedFile) {
    formData.append("image", selectedFile);
  }

  fetch("/api/message", {
    method: "POST",
    body: formData
  })
  .then(async res => {
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: "Error al enviar" }));
      throw e;
    }
    return res.json();
  })
  .then(data => {
    renderMessages(data.messages);
    document.getElementById("messageInput").value = "";
    selectedFile = null;
    document.getElementById("fotoInput").value = "";
  })
  .catch(err => {
    alert(err.error || "Error al enviar el mensaje");
  });
}

function refreshMessages() {
  if (!chatCode || !chatKey) return;

  fetch("/api/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatCode, chatKey })
  })
  .then(res => res.json())
  .then(data => {
    if (data.messages) {
      renderMessages(data.messages);
    }
    updateTurnUI(data.turn);
  })
  .catch(err => {
    console.error("Error al actualizar mensajes:", err);
  });
}

function renderMessages(messages) {
  const container = document.getElementById("messages");
  const shouldScroll = container.scrollTop + container.clientHeight >= container.scrollHeight - 20;

  container.innerHTML = messages.map(msg => {
    const isMe = msg.sender === myName;
    const cls = isMe ? "msg me" : "msg them";
    let html = `<div class="${cls}">`;

    if (msg.text) {
      html += `<p>${escapeHtml(msg.text)}</p>`;
    }

    if (msg.imageUrl) {
      html += `<img src="${msg.imageUrl}" class="imagen-turno" />`;
    }

    html += `</div>`;
    return html;
  }).join("");

  if (shouldScroll) {
    container.scrollTop = container.scrollHeight;
  }
}

function updateTurnUI(currentTurn) {
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendMessageBtn");
  const turnIndicator = document.getElementById("turnIndicator");

  if (!messageInput || !sendButton) return;

  if (currentTurn === myRole) {
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.placeholder = "Es tu turno. Escribe tu respuesta...";
    if (turnIndicator) turnIndicator.textContent = "✅ Es tu turno";
  } else {
    messageInput.disabled = true;
    sendButton.disabled = true;
    messageInput.placeholder = "Esperando al otro usuario...";
    if (turnIndicator) turnIndicator.textContent = `⏳ Turno de: ${currentTurn}`;
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    })[s];
  });
}

document.getElementById('fotoInput').addEventListener('change', function (e) {
  selectedFile = e.target.files[0];
});





