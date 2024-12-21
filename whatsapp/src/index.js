require("dotenv").config();

const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const app = express();
const port = process.env.PORT;

let base64QRCode = "";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Authorization"],
    maxAge: 600,
    methods: ["GET", "POST"],
    optionsSuccessStatus: 204,
  })
);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WhatsApp Web API",
      version: "1.0.0",
      description: "API para interação com o WhatsApp Web",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsDoc(options);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.toDataURL(qr, (err, qrCodeBase64) => {
    if (err) {
      console.error("Erro ao gerar QR Code em base64:", err);
    } else {
      base64QRCode = qrCodeBase64;
    }
  });
});

client.on("ready", () => {
  console.log("Cliente conectado ao WhatsApp Web!");
});

async function enviarMensagem(numero, mensagem) {
  const chatId = numero.substring(1) + "@c.us";
  try {
    await client.sendMessage(chatId, mensagem);
    console.log(`Mensagem enviada para ${numero}: "${mensagem}"`);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw new Error(
      "Falha ao enviar a mensagem. Verifique o número ou tente novamente mais tarde."
    );
  }
}

client.on("auth_failure", () => {
  console.log("Falha na autenticação!");
});

client.initialize();

app.get("/qr-code", (req, res) => {
  try {
    if (base64QRCode) {
      res.json({ qrCode: base64QRCode });
    } else {
      res
        .status(503)
        .send("QR Code ainda não gerado. Tente novamente mais tarde.");
    }
  } catch (error) {
    console.error("Erro ao buscar QR Code:", error);
    res.status(500).send("Erro interno ao buscar QR Code.");
  }
});

app.get("/qr-code/image", (req, res) => {
  try {
    if (base64QRCode) {
      res.send(`<img src="${base64QRCode}" alt="QR Code" />`);
    } else {
      res
        .status(503)
        .send("QR Code ainda não gerado. Tente novamente mais tarde.");
    }
  } catch (error) {
    console.error("Erro ao buscar QR Code:", error);
    res.status(500).send("Erro interno ao buscar QR Code.");
  }
});

app.post("/send-message", async (req, res) => {
  const { numero, mensagem } = req.body;

  if (!numero || !mensagem) {
    return res.status(400).send("Número e mensagem são obrigatórios.");
  }

  try {
    await enviarMensagem(numero, mensagem);
    res.send(`Mensagem enviada para ${numero}: "${mensagem}"`);
  } catch (error) {
    console.error("Erro no endpoint /send-message:", error);
    res.status(500).send(error.message);
  }
});

app.get("/chats", async (req, res) => {
  try {
    const chats = await client.getChats();
    res.send(chats);
  } catch (error) {
    console.error("Erro no endpoint /chats:", error);
    res.status(500).send("Erro ao buscar chats.");
  }
});

app.get("/chat/:number", async (req, res) => {
  const { number } = req.params;
  const chatId = number + "@c.us";

  try {
    const chat = await client.getChatById(chatId);
    if (!chat) {
      return res.status(404).send("Chat não encontrado.");
    }
    const messages = await chat.fetchMessages({ limit: 10 });
    res.send(messages);
  } catch (error) {
    console.error("Erro no endpoint /chat/:number:", error);
    res.status(500).send("Erro ao buscar mensagens do chat.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
