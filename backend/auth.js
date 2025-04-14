const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const secretKey = "deinGeheimerJWTKey";



class Auth {
    constructor(database) {
        this.db = database;
    }

    verifyToken(req, res, next) {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Kein Token vorhanden!" });

        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) return res.status(401).json({ error: "Token ungültig!" });
            req.user = decoded;
            next();
        });
    }

    generateToken(payload) {
        return jwt.sign(payload, secretKey, { expiresIn: "1h" });
    }

    checkLogin(loginData, callback) {
        const { email, password } = loginData;
        this.db.connection.query("SELECT * FROM kunden WHERE email = ?", [email], (err, result) => {
            if (err) return callback({ error: "Datenbankfehler" });
            if (result.length === 0) return callback({ error: "Benutzer nicht gefunden!" });

            const kunde = result[0];
            bcrypt.compare(password, kunde.passwort, (bcryptErr, isMatch) => {
                if (bcryptErr) return callback({ error: "Fehler beim Passwortabgleich" }, null);
                if (!isMatch) return callback({ error: "Falsches Passwort!" }, null);

                const token = this.generateToken({ KundenId: kunde.id, email: kunde.email });
                callback(null, { message: "Login erfolgreich!", token });
            });
        });
    }

    tokenCheck(req, callback) {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) return callback({ error: "Kein Token vorhanden!" });

        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) return callback({ error: "Token ungültig!" });
            req.user = decoded;
            callback(null, decoded);
        });
    }
}
module.exports = Auth;