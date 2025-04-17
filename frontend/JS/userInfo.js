import { tokenCheck } from './script.js';
  

export function initUserInfoPage(){
    tokenCheck();
    
    

    fetch("http://localhost:3000/api/getUser", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.token}`,
        }
    })
        .then(response => response.json())
        .then(data => {
            // Erstelle ein Objekt mit den IDs und den entsprechenden Daten
            const fields = {
                vorname: data.vorname,
                nachname: data.nachname,
                straße: data.str,
                hausnummer: data.hausnummer,
                plz: data.plz,
                wohnort: data.ort,
                email: data.email
            };
    
            // Iteriere über das Objekt und setze die Werte der entsprechenden HTML-Elemente
            for (const [key, value] of Object.entries(fields)) {
                const element = document.getElementById(key);
                if (element) {
                    element.textContent = value || "Nicht verfügbar";
                }
            }
        })
        .catch(error => {
            console.error("Fehler beim Laden der Benutzerdaten:", error);
        });
    }
const editButton = document.getElementById("editButton");
const modal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");

editButton.addEventListener("click", () => {
  // Werte aus dem Profil holen
  document.getElementById("editStraße").value = document.getElementById("straße").textContent;
  document.getElementById("editHausnummer").value = document.getElementById("hausnummer").textContent;
  document.getElementById("editWohnort").value = document.getElementById("wohnort").textContent;
  document.getElementById("editPLZ").value = document.getElementById("plz").textContent;

  modal.style.display = "flex";
});

function closeModal() {
  modal.style.display = "none";
}

editForm.addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const updatedData = {
      str: document.getElementById("editStraße").value,
      hausnummer: document.getElementById("editHausnummer").value,
      ort: document.getElementById("editWohnort").value,
      plz: document.getElementById("editPLZ").value,
      email: document.getElementById("email").textContent
    };
  
    try {
      const response = await fetch("http://localhost:3000/api/updateAdress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${window.token}`
        },
        body: JSON.stringify(updatedData)
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert("Adresse erfolgreich gespeichert.");
  
        // Optional: Werte auch im UI aktualisieren
        document.getElementById("straße").textContent = updatedData.str;
        document.getElementById("hausnummer").textContent = updatedData.hausnummer;
        document.getElementById("wohnort").textContent = updatedData.ort;
        document.getElementById("plz").textContent = updatedData.plz;
  
        closeModal();
      } else {
        alert("Fehler beim Speichern: " + (result.message || "Unbekannter Fehler"));
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Netzwerkfehler beim Speichern.");
    }
  });