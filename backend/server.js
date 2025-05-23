const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const Database = require("./db");
const Routes = require("./routes"); // 👈 Import der Routen
const Auth = require("./auth");
const orderStore = require("./orderStore");
const cookieParser = require("cookie-parser");



const store = new orderStore();
const db = new Database();
const auth = new Auth(db);
const routes = new Routes(auth, db, store);



const app = express();
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

// 📌 Fallback für SPA (Frontend)
app.get(/^\/(?!api|admin).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/index.html"));
});

// 📌 Server starten
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});





