const express = require('express');
const multer = require('multer');
const cors = require('cors');
const upload = multer();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const chats = {}; // estructura temporal en memoria

app.post('/api/create', (req, res) => {
  const { chatCode, chatKey } = req.body;
  if (!chatCode || !chatKey) return res.status(400).json({ error: "Faltan datos" });
  chats[chatCode] = { key: chatKey, messages: [], turn: null };
  res.json({ success: true });
});

app.post('/api/join', (req, res) => {
  const { chatCode, chatKey, name } = req.body;
  const chat = chats[chatCode];
  if (!chat || chat.key !== chatKey) return res.status(403).json({ error: "Código o clave incorrectos" });
  chat.turn = name;
  res.json({ role: name });
});

app.post('/api/message', upload.single('image'), (req, res) => {
  const { chatCode, chatKey, role, text } = req.body;
  const imageFile = req.file;
  const chat = chats[chatCode];
  if (!chat || chat.key !== chatKey) return res.status(403).json({ error: "Acceso denegado" });

  let imageUrl = null;
  if (imageFile) {
    imageUrl = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
  }

  chat.messages.push({ sender: role, text, imageUrl });
  res.json({ messages: chat.messages });
});

app.post('/api/list', (req, res) => {
  const { chatCode, chatKey } = req.body;
  const chat = chats[chatCode];
  if (!chat || chat.key !== chatKey) return res.status(403).json({ error: "Acceso denegado" });
  res.json({ messages: chat.messages, turn: chat.turn });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
