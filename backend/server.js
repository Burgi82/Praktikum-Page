const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const Database = require("./db");
const Routes = require("./routes"); // 👈 Import der Routen
const Auth = require("./auth");
const orderStore = require("./orderStore");

const store = new orderStore();
const db = new Database();
const auth = new Auth(db);
const routes = new Routes(auth, db, store);


const app = express();
app.use(bodyParser.json());
app.use(routes.getRouter()); // 👈 Alle API-Routen hier einbinden
app.use("/uploads", express.static("uploads")); // Bilder öffentlich zugänglich machen

// 📌 Statische Dateien bereitstellen (Frontend)
app.use(express.static(path.join(__dirname, "../frontend")));

// 📌 Fallback für SPA (Frontend)

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/index.html"));
});

// 📌 Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});





