const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del cliente
app.use(express.static(path.join(__dirname, "client")));

// Base de datos en memoria
const chats = {
  "abc123": { key: "clave123", messages: [], turn: "A", users: {} }
};

// --- ENDPOINTS DE LA API ---

// Crear un nuevo chat
app.post("/api/create", (req, res) => {
  try {
    const { chatCode, chatKey } = req.body;
    if (!chatCode || !chatKey) {
      return res.status(400).json({ error: "chatCode y chatKey son requeridos" });
    }
    if (chats[chatCode]) {
      return res.status(409).json({ error: "El código de chat ya existe" });
    }
    chats[chatCode] = { key: chatKey, messages: [], turn: "A", users: {} };
    res.status(201).json({ success: true });
  } catch (e) {
    console.error("[ERROR en /api/create]:", e);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Unirse a un chat existente
app.post("/api/join", (req, res) => {
  try {
    const { chatCode, chatKey, name } = req.body;
    const chat = chats[chatCode];
    if (!chat || chat.key !== chatKey) {
      return res.status(403).json({ error: "Código o clave incorrectos" });
    }

    chat.users = chat.users || {};
    chat.turn = chat.turn || "A";
    const safeName = (typeof name === "string" && name.trim()) ? name.trim() : null;
    if (!safeName) {
      return res.status(400).json({ error: "Se requiere un nombre/alias válido" });
    }

    if (chat.users.A === safeName) return res.json({ role: "A", name: chat.users.A, turn: chat.turn });
    if (chat.users.B === safeName) return res.json({ role: "B", name: chat.users.B, turn: chat.turn });

    if (!chat.users.A) {
      chat.users.A = safeName;
      return res.json({ role: "A", name: chat.users.A, turn: chat.turn });
    } else if (!chat.users.B) {
      chat.users.B = safeName;
      return res.json({ role: "B", name: chat.users.B, turn: chat.turn });
    } else {
      return res.status(403).json({ error: "El chat ya tiene dos participantes" });
    }
  } catch (e) {
    console.error("[ERROR en /api/join]:", e);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Enviar un mensaje
app.post("/api/message", (req, res) => {
  try {
    const { chatCode, chatKey, text, role } = req.body;
    const chat = chats[chatCode];
    if (!chat || chat.key !== chatKey) return res.status(403).json({ error: "No autorizado" });
    if (chat.turn !== role) return res.status(403).json({ error: "No es tu turno" });

    const author = chat.users[role] || role;
    chat.messages.push(`${author}: ${text}`);
    chat.turn = role === "A" ? "B" : "A";
    res.json({ messages: chat.messages, turn: chat.turn });
  } catch (e) {
    console.error("[ERROR en /api/message]:", e);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Obtener la lista de mensajes
app.post("/api/list", (req, res) => {
  try {
    const { chatCode, chatKey } = req.body;
    const chat = chats[chatCode];
    if (chat && chat.key === chatKey) {
      res.json({ messages: chat.messages, turn: chat.turn });
    } else {
      res.status(403).json({ error: "No autorizado" });
    }
  } catch (e) {
    console.error("[ERROR en /api/list]:", e);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en http://localhost:${PORT}`));
