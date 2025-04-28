const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const secretKey = "deinGeheimerJWTKey";

class Database{

    constructor(){
// MySQL Verbindung aufbauen
        this.connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "restaurant_db"
        });

        this.connection.connect(err => {
            if (err) {
                console.error("❌ Datenbankverbindung fehlgeschlagen:", err);
            } else {
                console.log("✅ Verbunden mit der MySQL-Datenbank!");
            }
        });
    }
    // **Funktionen für die Datenbankabfragen**

    getAllCustomers(callback){
        this.connection.query("SELECT * FROM kunden", callback);
    }

    addCustomer(customerData, callback) {
        const { vorname, nachname, str, hausnummer, ort, plz, email, password } = customerData;
    
        // E-Mail prüfen, ob sie schon existiert
        this.connection.query("SELECT * FROM kunden WHERE email = ?", [email], (err, result) => {
            if (err) return callback(err, null);
            if (result.length > 0) return callback({ error: "E-Mail existiert bereits!" }, null);
    
            // ✅ Hier brauchen wir eine separate Funktion, um `await` korrekt zu nutzen
            bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
                if (hashErr) return callback(hashErr, null);
    
                const sql = "INSERT INTO kunden (vorname, nachname, str, hausnummer, ort, plz, email, passwort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                this.connection.query(sql, [vorname, nachname, str, hausnummer, ort, plz, email, hashedPassword], callback);
            });
        });
    }

    getMenu(callback){
        this.connection.query("SELECT * FROM speisekarte", callback);
    }

    addMenuItem(menuItemData, callback){
        const { variety, name, description, price, image } = menuItemData;
        const sql = "INSERT INTO speisekarte (variety, name, description, price, image) VALUES (?, ?, ?, ?, ?)";
        this.connection.query(sql, [variety, name, description, price, image], callback);
    }
    getReservation(callback){
        this.connection.query("SELECT * FROM reservierungen", callback);
    }
    getResDate(date, callback){
        const sql ="SELECT * FROM reservierungen WHERE date = ?"
        this.connection.query(sql, [date], callback);
    }

    addReservation(reservationData, callback){
        const { name, email, date, time, guests, room, tblNr } = reservationData;
        const sql = "INSERT INTO reservierungen (name, email, date, time, guests, room, tblNr) VALUES (?, ?, ?, ?, ?, ?, ?)";
        this.connection.query(sql, [name, email, date, time, guests, room, tblNr], callback);
    }
    updateReservation(updateData, callback){
        const {Id, room, tblNr} = updateData;
        const sql = "UPDATE reservierungen SET room = ?, tblNr = ? WHERE Id = ?";
        this.connection.query(sql, [room, tblNr, Id], callback);
    }
    delReservation(reservationId, callback){
        const sql = "DELETE FROM reservierungen WHERE id = ?";
        this.connection.query(sql, [reservationId], callback);
    }
    getUser(kundenId, email, callback) {
        
        // Sicherstellen, dass sowohl kundenId als auch email vorhanden sind
        if (!kundenId || !email) {
            return callback(new Error("Fehlende KundenId oder email"));
        }
        
        const sql = "SELECT * FROM kunden WHERE id = ? AND email = ?";
        
        // SQL-Abfrage ausführen
        this.connection.query(sql, [kundenId, email], (err, results) => {
            if (err) {
                return callback(err); // Fehler an den Callback weitergeben
            }
            
            if (results.length === 0) {
                return callback(null, null); // Keine Übereinstimmung gefunden
            }
            
            // Wenn ein Ergebnis gefunden wird, an den Callback weitergeben
            return callback(null, results[0]);
        });
    }
    updateAdress(adressData, callback){
        const {str, hausnummer, ort, plz, email} = adressData;
        const sql = "UPDATE kunden SET str = ?, hausnummer = ?, ort = ?, plz = ? WHERE email=?";
        this.connection.query(sql, [str, hausnummer, ort, plz, email], callback);
    }
    createRoom(roomData, callback){
        const {name, tables} = roomData;
        const sql = "INSERT INTO gastraum (name, tables) VALUES (?, ?)";
        this.connection.query(sql, [name, tables], callback);
    }
    getRoomNames(callback){
        //Raumnamen abrufen:
        this.connection.query("SELECT name FROM gastraum", callback);
    }
    loadRoom(RoomName, callback){
        const name = RoomName.name;
        console.log(name);
        const sql = "SELECT tables FROM gastraum WHERE name = ?";
        this.connection.query(sql, [name], callback);
    }
    checkTbl(date, room, callback){
        const acDate = date;
        const acRoom = room;
        const sql = "SELECT * FROM reservierungen WHERE date = ? AND room = ?";
        this.connection.query(sql, [acDate, acRoom], callback);
    }
    startService(tableData, callback){
        const {resID} = tableData;
        const sql = "UPDATE reservierungen SET active = 1, startService = Now() WHERE id = ?";
        this.connection.query(sql, [resID], callback);

    }
    startNewService(resData, callback){
        const {room, tblNr} = resData;
        const sql = "INSERT INTO reservierungen (room, tblNr, active, startService) VALUES (?, ?, 1, Now())";
        this.connection.query(sql, [room, tblNr], callback)

    }
    checkOnService(tabelData, callback){
        const {room, tblNr, date} = tabelData;
        const startTime = "08:00:00";
        const endTime = "17:00:00";
        const today = date;
    
        const sql = 'SELECT active FROM tische WHERE room = ? AND tblNr = ? AND DATE(start) = ? AND TIME(start) BETWEEN ? AND ?'
        
        this.connection.query(sql, [room, tblNr, today, startTime, endTime], callback);

    }
    delTblRes(resData, callback){
        const resID = resData.resID;
        console.log(resID);
        const sql = "UPDATE reservierungen SET room = NULL, tblNr = NULL WHERE id = ?";
        this.connection.query(sql, [resID], callback);
    }
    breakService(resData, callback){
        const resID = resData.resID;
        const sql = "UPDATE reservierungen SET startService = NULL, active = FALSE WHERE id = ?";
        this.connection.query(sql,[resID], callback);

    }
}

// **Export der Abfragen**
module.exports = Database;