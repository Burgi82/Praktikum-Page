


export function tokenCheck(){
    
 
        fetch("http://192.168.91.68:3000/api/tokenCheck", {
            method: "GET",
            credentials: "include",
        })
        .then(res => {
            if(res.ok){
                console.log("Sie sind eingelogggt");
            }else{
                console.log("Bitte einloggen!")
                window.location.href= "/login";
            }
             roleCheck();
        });
     
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
            overlay.className = "modal";
    
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

 



