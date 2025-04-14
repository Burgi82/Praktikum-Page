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

    addReservation(reservationData, callback){
        const { name, email, date, time, guests } = reservationData;
        const sql = "INSERT INTO reservierungen (name, email, date, time, guests) VALUES (?, ?, ?, ?, ?)";
        this.connection.query(sql, [name, email, date, time, guests], callback);
    }
    delReservation(reservationId, callback){
        const sql = "DELETE FROM reservierungen WHERE id = ?";
        this.connection.query(sql, [reservationId], callback);
    }

}

// **Export der Abfragen**
module.exports = Database;