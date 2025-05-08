

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
    isLoggedIn()
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
export function isLoggedIn(){
    if (typeof window.token === "undefined") {
        window.token = localStorage.getItem("token");
    }
    
    console.log("Token:", window.token);
    
    if (!window.token || isTokenExpired(window.token)) {
        console.log("Nicht angemeldet!");
        document.getElementById("adminSection").style.display ="none";

    }else{
        document.getElementById("adminSection").style.display ="flex";
    }
}

    export function showConfirmationPopup(actionName) {
        return new Promise((resolve, reject) => {
            // Erstelle den Hintergrund für das Popup
            const overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
            overlay.style.display = "flex";
            overlay.style.justifyContent = "center";
            overlay.style.alignItems = "center";
            overlay.style.zIndex = "1000";
    
            // Erstelle das Popup-Fenster
            const popup = document.createElement("div");
            popup.classList.add("confirmPopup")
    
            // Füge den Text hinzu
            const message = document.createElement("p");
            message.textContent = `"${actionName}"`;
            message.style.marginBottom = "20px";
           
            popup.appendChild(message);
    
            // Erstelle die Bestätigungs-Schaltfläche
            const confirmButton = document.createElement("button");
            confirmButton.textContent = "Ja";
            confirmButton.addEventListener("click", () => {
                document.body.removeChild(overlay);
                resolve(true); // Aktion wurde bestätigt
            });
            popup.appendChild(confirmButton);
    
            // Erstelle die Abbrechen-Schaltfläche
            const cancelButton = document.createElement("button");
            cancelButton.textContent = "Nein";
            cancelButton.addEventListener("click", () => {
                document.body.removeChild(overlay);
                reject(false); // Aktion wurde abgelehnt
            });
            popup.appendChild(cancelButton);
    
            // Füge das Popup dem Overlay hinzu
            overlay.appendChild(popup);
    
            // Füge das Overlay dem Dokument hinzu
            document.body.appendChild(overlay);
        });
    }


// Nur definieren, wenn noch nicht vorhanden

