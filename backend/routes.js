const express = require("express");
const multer = require("multer");
const path = require("path");




class Routes{
    constructor(auth, database){
        this.router = express.Router();
        this.auth = auth;
        this.db = database;

        const storage = multer.diskStorage({
            destination: "./uploads/",
            filename: (req, file, cb) => {
                cb(null, Date.now() + path.extname(file.originalname)); // Einzigartiger Name
            }
        });

        this.upload = multer({ storage });

        this.initializeRoutes();
    }

    initializeRoutes(){
        // API: Kundenliste abrufen
        this.router.get("/api/kunden", (req, res) => {
            this.db.getAllCustomers((err, results) => {
                if(err) return res.status(500).json({ error: "Fehler beim Aufrufen der Kunden"});
                res.json(results);
            });
        });
        // API: Kunde erstellen
        this.router.post("/api/kunden", this.auth.verifyToken, (req, res)=>{
            
            this.db.addCustomer(req.body, (err, result) => {
                if (err) {
                    console.error("Fehler beim Speichern:", err); // 🛠 Fehler in der Konsole loggen
                    return res.status(500).json({ error: "Datenbankfehler", details: err });
                }
                console.log("Neuer Kunde hinzugefügt, ID:", result.insertId); // ✅ Erfolg loggen
                res.json({ message: "Kunde erfolgreich registriert!", customerId: result.insertId });
            });
        });
        // API: Speisekarte abrufen
        this.router.get("/api/speisekarte", (req, res) => {
            this.db.getMenu((err, results) => {
                if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Speisekarte" });
                res.json(results);
            });
        });

        // Route zum Hinzufügen eines Gerichts mit Bild
        this.router.post("/api/speisekarte", this.auth.verifyToken, this.upload.single("image"), (req, res) => {
            const { variety, name, description, price } = req.body;
            const image = req.file ? `/uploads/${req.file.filename}` : null; // Bildpfad speichern

            if (!variety ||!name || !description || !price || !image) {
                return res.status(400).json({ error: "Alle Felder sind erforderlich!" });
            }

            const menuItemData = { variety, name, description, price, image };
            this.db.addMenuItem(menuItemData, (err, result) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einfügen des Gerichts", details: err });
                res.json({ message: "Gericht erfolgreich hinzugefügt!", gerichtId: result.insertId });
            });
        });
         // API: Speisekarte abrufen
         this.router.get("/api/reservierungen", (req, res) => {
            this.db.getReservation((err, results) => {
                if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Reservierungen" });
                res.json(results);
            });
        });
        this.router.post("/api/resDate", (req, res) => {
            const {date} = req.body;
            this.db.getResDate(date, (err, results) => {
                if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Tages-Reservierungen" });
                console.log(results);
                res.json(results);
            });
        });
        //API: Kundendaten auslesen
        this.router.post("/api/getUser", this.auth.verifyToken, (req, res)=>{
            const{kundenId, email} = req.user;
            this.db.getUser(kundenId, email, (err, result)=> {
                if (err) return res.status(500).json({ error: "Fehler beim Laden der Kundendaten", details: err });
                res.json(result);
            });
        });

        // API: Neue Reservierung hinzufügen
        this.router.post("/api/reservierungen", this.auth.verifyToken, (req, res) => {
            this.db.addReservation(req.body, (err, result) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einfügen des der Reservierung", details: err });
                res.json({ message: "Reservierung erfolgreich hinzugefügt!", gerichtId: result.insertId });
            });
        });
        this.router.post("/api/updateReservation", this.auth.verifyToken, (req, res) => {
            this.db.updateReservation(req.body, (err, result) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einfügen des Updates der Reservierung", details: err });
                res.json({ message: "Reservierung erfolgreich bearbeitet!", gerichtId: result.insertId });
            });
        });
        this.router.post("/api/reservierungen/loeschen", this.auth.verifyToken, (req, res) => {
            const id = req.body.id;
        
            this.db.delReservation(id, (err, result) => {
                if (err) return res.status(500).json({ error: "Löschen fehlgeschlagen", details: err });
                res.json({ message: "Reservierung erfolgreich gelöscht!" });
            });
        });
        this.router.post("/api/login", (req, res) =>{
            this.auth.checkLogin(req.body, (err, result) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einloggen", details: err });
                res.json({ message: "Einloggen erfolgreich!", token: result.token });
            });

        
        });
        this.router.get("/api/tokenCheck", this.auth.verifyToken, (req, res) => {
            this.auth.tokenCheck(req, (err, decoded) =>{
                if(err) return res.status(401).json({ error: err.error });
                res.json({ message: "Tokenprüfung erfolgreich!", KundenId: decoded.KundenId });
            });

        });
        this.router.post("/api/updateAdress", this.auth.verifyToken, (req, res) =>{
            this.db.updateAdress(req.body, (err, result)=>{
                if (err) {
                    return res.status(500).json({ error: "Update der Adresse fehlgeschlagen", details: err });
                }
                res.json({ message: "Adresse erfolgreich geändert!" });
            });
        });
        this.router.post("/api/createRoom", (req, res) =>{
            console.log(req.body);
            this.db.createRoom(req.body, (err, result) => {
                if(err){
                    return res.status(500).json({error: "Raum konnte nicht angelegt werden", details: err});
                }
                res.json({message: "Raum erfolgreich angelegt!"});
            });
        });
        this.router.get("/api/getRoomNames", (req, res) => {
            this.db.getRoomNames((err, results) => {
                if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Speisekarte" });
                console.log(results);
                res.json(results);
            });
        });
        this.router.post("/api/loadRoom", (req, res) =>{
            const name = req.body;
            this.db.loadRoom(name, (err, result)=> {
                if(err){
                    return res.status(500).json({error: "Raum konnte nicht geladen werden", details: err});
                }
                console.log(result);
                res.json(result);
            });
        });
        this.router.post("/api/checkTbl", (req, res) =>{
            const {date, room} = req.body
            this.db.checkTbl(date, room, (err, result)=> {
                if(err){
                    return res.status(500).json({error: "Belegung konnte nicht geladen werden", details: err});
                }
                console.log(result);
                res.json(result);
            });
        });
    }
    getRouter(){
        return this.router;
    }
}
module.exports = Routes;