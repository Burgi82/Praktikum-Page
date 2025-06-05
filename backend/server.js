const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const Database = require("./db");
const Routes = require("./routes"); // 👈 Import der Routen
const Auth = require("./auth");
const orderStore = require("./orderStore");
const cookieParser = require("cookie-parser");
const http = require("http");
const WebSocket = require("ws");






const store = new orderStore();
const db = new Database();
const auth = new Auth(db);
const routes = new Routes(auth, db, store, broadcast);



const app = express();
const server = http.createServer(app)
const wss = new WebSocket.Server({server});
const clients = new Set();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(routes.getRouter()); // 👈 Alle API-Routen hier einbinden
app.use("/uploads", express.static("uploads")); // Bilder öffentlich zugänglich machen

// 📌 Statische Dateien bereitstellen (Frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

// 📌 Statische Dateien bereitstellen (Frontend-Admin)
app.use('/admin', express.static(path.join(__dirname, "../frontend-admin")));

// 📌 Fallback für SPA (Frontend-Admin)
app.get(/^\/admin(?!\/api).*/, (req, res) =>{
  res.sendFile(path.resolve(__dirname, "../frontend-admin/index.html"));
});
app.get(/^\/game(?!\/api).*/, (req, res) =>{
  res.sendFile(path.resolve(__dirname, "../frontend/game.html"));
});

// 📌 Fallback für SPA (Frontend)
app.get(/^\/(?!api|admin).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/index.html"));
});

wss.on("connection", (ws) =>{
  console.log("Websocket verbunden");
  clients.add(ws);

  ws.on("message", (message) => {
    console.log("📩 Nachricht vom Client:", message);
    // Beispiel: Broadcast an alle Clients
    for (let client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Echo: ${message}`);
      }
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket getrennt");
    clients.delete(ws);
  });
});

// 📌 Server starten
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});

function broadcast(type, data){
  const payload = JSON.stringify({type, data});
  for(const client of clients){
    if(client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}



