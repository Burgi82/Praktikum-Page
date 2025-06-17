const express = require("express");
const multer = require("multer");
const path = require("path");
const cron = require("node-cron");
const fs = require("fs");







class Routes{
    constructor(auth, database, store, broadcastFn){
        this.router = express.Router();
        this.auth = auth;
        this.db = database;
        this.store = store;
        this.broadcast = broadcastFn;

        const storage = multer.diskStorage({
            destination: "./uploads/",
            filename: (req, file, cb) => {
                cb(null, Date.now() + path.extname(file.originalname)); // Einzigartiger Name
            }
        });

        this.upload = multer({ storage });
         // Backup-Verzeichnis definieren
         this.backupDir = "./backups/";
         if (!fs.existsSync(this.backupDir)) {
             fs.mkdirSync(this.backupDir); // Verzeichnis erstellen, falls es nicht existiert
         }
        this.cleanBackupDir();
        this.scheduleOrderBackup();
        this.initializeRoutes();
    }
    saveBackup(data, filename){
        const filePath = path.join(this.backupDir, filename);
        fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) =>{
            if(err){
                console.error("Fehler beim Speichern des Backups:", err);
            }else{
                console.log("Backup erfolgreich gespeichert:", filePath);               
            }
        });
    }
    scheduleOrderBackup() {
        cron.schedule("*/30 * * * *", () => { // Alle 30 Minuten
            console.log("Starte automatisches Backup der Bestellungen...");
            this.store.getAllOrders((err, orders) => {
                if (err) {
                    return console.error("Fehler beim Abrufen der Bestellungen für das Backup:", err.message);
                }
    
                const timestamp = Date.now();
                const filename = `orders_backup_${timestamp}.json`;
                this.saveBackup(orders, filename);
            });
        });
    }
     // Funktion zur Löschung alter Backups
     cleanBackupDir(maxAgeInDays = 1) {
        const maxAgeInMs = maxAgeInDays * 24 * 60 * 60 * 1000; // Alter in Millisekunden
        const now = Date.now();

        fs.readdir(this.backupDir, (err, files) => {
            if (err) {
                console.error("Fehler beim Lesen des Backup-Verzeichnisses:", err);
                return;
            }

            files.forEach(file => {
                const filePath = path.join(this.backupDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error("Fehler beim Abrufen der Dateiinformationen:", err);
                        return;
                    }

                    // Prüfen, ob die Datei älter als maxAgeInMs ist
                    if (now - stats.mtimeMs > maxAgeInMs) {
                        fs.unlink(filePath, err => {
                            if (err) {
                                console.error("Fehler beim Löschen der Datei:", err);
                            } else {
                                console.log("Alte Backup-Datei gelöscht:", filePath);
                            }
                        });
                    }
                });
            });
        });
    }
    loadBackupFile(filename, callback) {
        const filePath = path.join(this.backupDir, filename);

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                console.error("Fehler beim Laden der Backup-Datei:", err);
                return callback(err);
            }

            try {
                const jsonData = JSON.parse(data); // JSON-Inhalt parsen
                callback(null, jsonData);
            } catch (parseErr) {
                console.error("Fehler beim Parsen der Backup-Datei:", parseErr);
                callback(parseErr);
            }
        });
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
        this.router.post("/api/kunden",(req, res)=>{
            
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
            const { variety, name, description, price, allergens } = req.body;
            const image = req.file ? `/uploads/${req.file.filename}` : null; // Bildpfad speichern

            if (!variety ||!name || !description || !price || !image) {
                return res.status(400).json({ error: "Alle Felder sind erforderlich!" });
            }

            const menuItemData = { variety, name, description, price, image, allergens };
            this.db.addMenuItem(menuItemData, (err, result) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einfügen des Gerichts", details: err });
                res.json({ message: "Gericht erfolgreich hinzugefügt!", gerichtId: result.insertId });
            });
        });
         // API: Reservierungen abrufen
         this.router.get("/api/reservierungen",this.auth.verifyToken, (req, res) => {
            this.db.getReservation((err, results) => {
                if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Reservierungen" });
                res.json(results);
            });
        });
        this.router.get("/api/getBills",this.auth.verifyToken, (req, res) => {
            this.db.getBills((err, results) => {
                if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Rechnungen" });
                res.json(results);
            });
        });
        this.router.post("/api/resDate", this.auth.verifyToken, (req, res) => {
            const {date} = req.body;
            this.db.getResDate(date, (err, results) => {
                if (err) return res.status(500).json({ error: "Fehler beim Abrufen der Tages-Reservierungen" });
                console.log(results);
                res.json(results);
            });
        });
        //API: Kundendaten auslesen
        this.router.post("/api/getUser", this.auth.verifyToken, (req, res)=>{
            const{id, email} = req.user;
            this.db.getUser(id, email, (err, result)=> {
                if (err) return res.status(500).json({ error: "Fehler beim Laden der Kundendaten", details: err });
                res.json(result);
            });
        });

        // API: Neue Reservierung hinzufügen
        this.router.post("/api/reservierungen", this.auth.verifyToken, (req, res) => {
            this.db.addReservation(req.body, (err) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einfügen des der Reservierung", details: err });
                res.json({ message: "Reservierung erfolgreich hinzugefügt!"});
            });
        });
        this.router.post("/api/updateReservation", this.auth.verifyToken, (req, res) => {
            this.db.updateReservation(req.body, (err) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einfügen des Updates der Reservierung", details: err });
                res.json({ message: "Reservierung erfolgreich bearbeitet!"});
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
            this.auth.checkLogin(req.body, res, (err, result) => {
                if (err) return res.status(500).json({ error: "Fehler beim Einloggen", details: err });
                res.json(result);
            });

        
        });
        this.router.get("/api/tokenCheck", this.auth.verifyToken, (req, res) => {
            this.auth.tokenCheck(req, (err, decoded) =>{
                if(err){
                    res.clearCookie("token");
                    return res.status(401).json({ error: err.error });
                } 
                res.json({ message: "Tokenprüfung erfolgreich!", KundenId: decoded.KundenId });
            });

        });
        this.router.get("/api/roleCheck", this.auth.verifyToken, (req, res) => {
            this.auth.tokenCheck(req, (err, decoded) => {
                 if(err){
                    res.clearCookie("token");
                    return res.status(401).json({ error: err.error });
                    
                }
                console.log(decoded.id, decoded.email, decoded.role); 
                res.json({ message: "Tokenprüfung erfolgreich!", role: decoded.role, id: decoded.id });
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
        this.router.post("/api/deleteRoom", (req, res) =>{
            console.log(req.body);
            this.db.deleteRoom(req.body, (err, result) => {
                if(err){
                    return res.status(500).json({error: "Raum konnte nicht gelöscht werden", details: err});
                }
                res.json({message: "Raum erfolgreich gelöscht!", result});
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
        this.router.post("/api/startService", (req, res) =>{
            this.db.startService(req.body, (err, result)=> {
             if(err){
                 return res.status(500).json({error: "Tisch konnte nicht gestartet werden", details: err});
             }
             res.json("Service erfolgreich gestartet");
         });
        });
        this.router.post("/api/startNewService", (req, res) =>{
            this.db.startNewService(req.body, (err, result)=> {

             if(err){
                 return res.status(500).json({error: "Tisch konnte nicht gestartet werden", details: err});
             }
             console.log(result);
             res.json("Service erfolgreich gestartet");
         });
        });


        this.router.post("/api/checkOnService",this.auth.verifyToken, (req, res) =>{
               this.db.checkOnService(req.body, (err, results)=> {
                if(err) return res.status(500).json({error: "Tisch konnte nicht geladen werden", details: err});
                
                if(results.length === 0 ){
                    //Tisch nicht gefunden
                    return res.json({active: false})
                }
                res.json({ active: true, data: results[0] });
            });
        });
       this.router.post("/api/delTblRes", this.auth.verifyToken, (req, res) => {
        const orderId = req.body.resID;
        this.db.delTblRes(req.body, (err, results) => {
            if (err) {
            if (!res.headersSent) {
                return res.status(500).json({ error: "Tischreservierung konnte nicht entfernt werden!" });
            }
            return;
            }

            this.store.deleteOrder(orderId, (err2) => {
            if (err2) {
                if (!res.headersSent) {
                return res.status(500).json({ error: "Bestellung konnte nicht entfernt werden!" });
                }
                return;
            }

            if (!res.headersSent) {
                res.json("Tischreservierung erfolgreich entfernt");
            }
            });
        });
        });
        this.router.post("/api/breakService",this.auth.verifyToken, (req, res) => {
            this.db.breakService(req.body, (err, results)=> {
                if(err) {return res.status(500).json({error: "Service konnte nicht unterbrochen werden!"});
                    }
                
                res.json("Service unterbrochen");
            });
        });
        this.router.get("/api/activeTbl",this.auth.verifyToken, (req, res) => {
            this.db.activeTbl((err, results) => {
                if (err) {
                    console.error("Fehler beim Abrufen der aktiven Tische!", err)
                    return res.status(500).json({ error: "Fehler beim Abrufen der aktiven Tische", details: err });
                }
                console.log("Aktive Tische;", results);
                res.json(results);
            });
        });
        this.router.post("/api/addGuest", this.auth.verifyToken, (req, res)=>{
            const resData = req.body;
            this.db.addGuest(resData, (err, results)=> {
                if(err){
                    console.error("Fehler beim Hinzufügen des Gastes (DB)!", err)
                    return res.status(500).json({ error: "Fehler beim Hinzufügen des Gastes (DB)!", details: err });
                }
                res.json({message: "Gast wurde hinzugefügt!", results})
            })
        })
        this.router.post("/api/saveGuestBill", this.auth.verifyToken, (req, res) => {
            
            this.db.saveGuestBill(req.body, (err, results) => {
                if (err) {
                    console.log("Fehler: ",err);
                    return res.status(500).json({ error: "Fehler beim Erstellen der Rechnung" });
                }
                console.log(results);
                res.json(results);
            });
        });
        this.router.post("/api/saveTblBill", this.auth.verifyToken, (req, res) => {
            
            this.db.saveTblBill(req.body, (err, results) => {
                if (err) {
                    console.log("Fehler: ",err);
                    return res.status(500).json({ error: "Fehler beim Erstellen der Rechnung" });
                }
                console.log("Results:", results);
                res.json(results);
            });
        });
        this.router.post("/api/createOrder", this.auth.verifyToken,(req, res) => {
            this.store.createOrder(req.body, (err, results)=>{
                if(err) {return res.status(500).json({error: "Bestellung konnte nicht erstellt werden", results});
            }
            res.json({ message: "Bestellung erstellt", results });
            console.log("Bestellung: ", results);
            });
        });
        this.router.post("/api/addItem", this.auth.verifyToken,(req,res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "setOrder");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Aufgeben einer Bestellung!" });
            }
            this.store.addItem(req.body, (err, results)=>{
                if(err) {
                    console.error("Fehler beim Hinzufügen des Artikels", err.message);
                    return res.status(500).json({error: err.message});
                }
                res.json({ message: "Artikel hinzugefügt", results });
            console.log("Artikel: ", results);
            
            });
        });
        this.router.post("/api/addMultipleItems", this.auth.verifyToken,async (req, res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "setOrder");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Aufgeben einer Bestellung!" });
            }
            const order= req.body;
            this.store.addMultipleItems(order, (err, results)=> {
                if(err) {
                    return res.status(500).json({error: err.message})
                }
                this.broadcast("new-order", results);
                res.json({ message: "Artikel hinzugefügt", results });
                console.log("Artikel: ", results);
            });
            
        });
        this.router.post("/api/removeItem", this.auth.verifyToken,(req, res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "editOrders");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Entfernen von Artikeln!" });
            }

            
            this.store.removeItem(req.body, (err, results)=>{
                if(err) {return res.status(500).json({error: err.message});
                }
                console.log("TEST:",results);
                this.broadcast("new-order", results);
                
                res.json({ message: "Artikel entfernt", results });
                console.log("Artikel: ", results);
            });
        });
        
        
        this.router.post("/api/getOrder", this.auth.verifyToken, (req,res) => {
            this.store.getOrder(req.body, (err, results) => {
                if (err) {
                    console.error("Fehler beim Abrufen der Bestellung!", err)
                    return res.status(500).json({ error: err.message});
                }
                res.json(results);
            });           
        });
        this.router.post("/api/getTblOrder", this.auth.verifyToken, (req,res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "editOrders");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Ändern des Artikelstatus!" });
            }
            this.store.getTblOrder(req.body, (err, results) => {
                if (err) {
                    console.error("Fehler beim Abrufen der Bestellung!", err)
                    return res.status(500).json({ error: err.message});
                }
                res.json(results);
            });           
        });
        this.router.get("/api/getTodayOrders", this.auth.verifyToken, (req, res) =>{
            this.store.getTodayOrders((err, orders) =>{
                if(err){
                    console.error("Fehler beim Abrufen der Bestellungen:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json(orders);
            });
        });
         this.router.post("/api/changeOrderState", this.auth.verifyToken,(req,res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "editOrders");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Ändern des Artikelstatus!" });
            }
            this.store.changeOrderState(req.body, (err, results)=>{
                if(err) {
                    console.error("Fehler beim Ändern der Bestellung", err.message);
                    return res.status(500).json({error: err.message});
                }
                const order = this.store.orders.get(req.body.orderId);
                this.broadcast("new-order", order)
                res.json({ message: "Bearbeitung aktiv", results });
            console.log("Bestellung: ", results);
            
            });
        });
        this.router.post("/api/changeItemState", this.auth.verifyToken,(req,res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "editOrders");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Ändern des Artikelstatus!" });
            }
            this.store.changeItemState(req.body, (err, results)=>{
                if(err) {
                    console.error("Fehler beim Ändern des Artikels", err.message);
                    return res.status(500).json({error: err.message});
                }
                const orderId = Number(req.body.orderId);
                const order = this.store.orders.get(orderId);
                console.log(req.body.orderId);
                console.log(order);
                this.broadcast("new-order", order)
                res.json({ message: "Bearbeitung aktiv", results });
            console.log("Bestellung: ", results);
            
            });
        });
        this.router.post("/api/changeItemStateBack", this.auth.verifyToken,(req,res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "editOrders");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Ändern des Artikelstatus!" });
            }
            this.store.changeItemStateBack(req.body, (err, results)=>{
                if(err) {
                    console.error("Fehler beim Ändern des Artikels", err.message);
                    return res.status(500).json({error: err.message});
                }
                const orderId = Number(req.body.orderId);
                const order = this.store.orders.get(orderId);
                console.log(req.body.orderId);
                console.log(order);
                this.broadcast("new-order", order)
                res.json({ message: "Bearbeitung aktiv", results });
            console.log("Bestellung: ", results);
            
            });
        });
        this.router.get("/api/getAllOrders", this.auth.verifyToken, (req, res) => {
            this.store.getAllOrders((err, orders) => {
                if (err) {
                    console.error("Fehler beim Abrufen der Bestellungen:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json(orders); // Erfolgreich, Bestellungen als JSON zurückgeben
            });
        });
        this.router.get("/api/orderBackup", this.auth.verifyToken, (req,res)=>{
            this.store.getAllOrders((err, orders)=>{
                if (err) {
                    console.error("Fehler beim Abrufen der Bestellungen:", err.message);
                    return res.status(500).json({ error: err.message });
                }

                const timestamp = Date.now();
                const filename = `orders_backup_${timestamp}.json`;
                this.saveBackup(orders, filename);

                res.json({message: "Backup erfolgreich erstellt", filename});

            });
        });
        this.router.post("/api/reloadOrders", this.auth.verifyToken, (req, res)=>{

            const { filename } = req.body; // Dateiname aus der Anfrage
            if (!filename) {
                return res.status(400).json({ error: "Dateiname ist erforderlich" });
            }

            this.loadBackupFile(filename, (err, jsonData) => {
                if (err) {
                    return res.status(500).json({ error: "Fehler beim Laden der Backup-Datei", details: err.message });
                }

                try {
                    jsonData.forEach(order => {
                        this.store.importOrder(JSON.stringify(order)); // Übergabe an importOrder
                    });
                    res.json({ message: "Bestellungen erfolgreich importiert" });
                } catch (importErr) {
                    console.error("Fehler beim Importieren der Bestellungen:", importErr);
                    res.status(500).json({ error: "Fehler beim Importieren der Bestellungen", details: importErr.message });
                }
            });
        });
        this.router.post("/api/dishSelection", this.auth.verifyToken, (req, res)=>{
            this.db.dishSelection(req.body, (err, results)=>{
                if(err) {return res.status(500).json({error: "Gerichte konnten nicht geladen werden", err});
                    }
                
                res.json(results);
            });
        });
        this.router.post("/api/logout", (req, res) => {
            res.clearCookie("token", {
            httpOnly: true,
            sameSite: "Strict",
            secure: false // ggf. auf true, wenn HTTPS
            });
        res.json({ message: "Logout erfolgreich!" });
        });
        this.router.get("/api/checkAccess",this.auth.verifyToken, (req, res) =>{
            const user = req.user;
            const path = req.query.path;

            const accessRules = {
                roomManager: ["employee", "admin"],
                admin: ["admin"],
                userInfo: ["guest", "employee", "admin"],
            }
            if(!accessRules[path]){
                return res.status(200).json({ allowed: true, role: user?.role || "guest"});
            }
            if(!user ||!user.role){
                return res.status(401).json({error: "Nicht angemeldet!"});
            }
            const allowedRoles = accessRules[path] || [];
            const hasAccess = allowedRoles.includes(user.role);

            if(!hasAccess){
                console.log("nicht authentifizierter Versuch!");
                return res.status(403).json({error: "Zugriff verweigert"});
                
            }
            res.json({allowed: true, role: user.role});
        });
        this.router.post("/api/payGuestBill", this.auth.verifyToken,(req,res) => {
            const user = req.user;
            const hasAccess = this.auth.verifyAccess(user, "editOrders");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Ändern des Artikelstatus!" });
            }
            this.store.payGuestBill(req.body, (err, results)=>{
                if(err) {
                    console.error("Fehler beim Zahlvorgang", err.message);
                    return res.status(500).json({error: err.message});
                }
                const orderId = Number(req.body.orderId);
                const order = this.store.orders.get(orderId);
                console.log(req.body.orderId);
                console.log(order);
                this.broadcast("new-order", order)
                res.json({ message: "Bearbeitung aktiv", results });
                console.log("Bestellung: ", results);
            
            });
        });
    
        this.router.post("/api/payTblBill", this.auth.verifyToken,(req,res) => {
            const user = req.user;
            console.log("Req.Body:", req.body);
            const orderData = req.body.tblBillData;
            const hasAccess = this.auth.verifyAccess(user, "editOrders");
            if (!hasAccess) {
                return res.status(403).json({ error: "Keine Berechtigung zum Ändern des Artikelstatus!" });
            }
            this.store.payTblBill(orderData, (err, results)=>{
                if(err) {
                    console.error("Fehler beim Zahlvorgang", err.message);
                    return res.status(500).json({error: err.message});
                }
                
                const order = results;
                this.broadcast("new-order", order)
                console.log("Bestellung: ", results);
                res.json({ results });
            });
        });
    }
    getRouter(){
        return this.router;
    }

}
module.exports = Routes;