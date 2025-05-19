require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;





class Auth {
    constructor(database) {
        this.db = database;
    }

    verifyToken(req, res, next) {
        const token = req.cookies?.token;
        if (!token) return res.status(401).json({ error: "Kein Token vorhanden!" });

        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) { console.error("Token Verifirzierungsfehler:", err);
            return res.status(401).json({ error: "Token ungültig!" 

                });
            }
            req.user = decoded;
            next();
        });
    }

    generateToken(payload) {
        return jwt.sign(payload, secretKey, { expiresIn: "1h" });
    }

    checkLogin(loginData, res, callback) {
        const { email, password } = loginData;
        this.db.connection.query("SELECT * FROM kunden WHERE email = ?", [email], (err, result) => {
            if (err) return callback({ error: "Datenbankfehler" });
            if (result.length === 0) return callback({ error: "Benutzer nicht gefunden!" });

            const kunde = result[0];
            bcrypt.compare(password, kunde.passwort, (bcryptErr, isMatch) => {
                if (bcryptErr) return callback({ error: "Fehler beim Passwortabgleich" }, null);
                if (!isMatch) return callback({ error: "Falsches Passwort!" }, null);

                const token = this.generateToken({ 
                    kundenId: kunde.id, email: 
                    kunde.email, role: 
                    kunde.role
                });                
            
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "Strict",
                    maxAge: 3600000
                });
                callback(null, { message: "Login erfolgreich!"});
            });
        });
    }

    tokenCheck(req, callback) {
        const token = req.cookies?.token;
        if (!token) return callback({ error: "Kein Token vorhanden!" });

        jwt.verify(token, secretKey, (err, decoded) => {

            if (err) {
                console.error("Token-Verifizierung fehlgeschlagen!", err.message);
                return callback({ error: "Token ungültig oder abgelaufen!" });
            }
            callback(null, decoded);
        });
    }
}
module.exports = Auth;