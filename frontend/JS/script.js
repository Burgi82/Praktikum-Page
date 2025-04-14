function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log(payload);
        const now = Date.now() / 1000; // Sekunden
        return payload.exp < now;
    } catch (e) {
        console.log("Token ungültig");
        return true; // Token ungültig oder manipuliert
    }
}
export function tokenCheck(){
    if (typeof window.token === "undefined") {
        window.token = localStorage.getItem("token");
    }
    
    console.log("Token:", window.token);
    
    if (!window.token || isTokenExpired(window.token)) {
        console.log("Token nicht vorhanden oder abgelaufen");
        localStorage.removeItem("token");
        window.token = undefined;
        window.location.href = "/login"; // Weiterleitung zur Login-Seite
        alert("Bitte anmelden!");
    } else {
        fetch("http://localhost:3000/api/tokenCheck", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${window.token}`
            }
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error("Fehler:", error));
    }
}
// Nur definieren, wenn noch nicht vorhanden

