require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const User = require('./user')




class Auth {
    constructor(database) {
        this.db = database;
    }

    verifyToken(req, res, next) {
        const token = req.cookies?.token;
        if (!token) {
            req.user = null;
            return next();
        }
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) { console.error("Token Verifirzierungsfehler:", err);
                res.clearCookie("token");
                req.user = null;
            }else{
                console.log("ID:", decoded.id);
                const user = createUserFromPayload(decoded); 
                req.user = user;
            }
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
                console.log("id from DB:", kunde.id);
                const token = this.generateToken({ 
                    id: kunde.id, 
                    email: kunde.email, 
                    role: kunde.role
                });                
            
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "Lax",
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
    verifyAccess(user, action){
    switch(action) {
        case 'editOrders':
            return user.canEditOrders();
        case 'viewAdminPanel':
            return user.canViewAdminPanel();
        case 'setOrder':
            return user.canSetOrder();
        default:
            return false;
    }

}

}

function createUserFromPayload(payload){
    return new User({
        id: payload.id,
        email: payload.email,
        role: payload.role,
    });
}



module.exports = Auth;