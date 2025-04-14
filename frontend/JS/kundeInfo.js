import { tokenCheck } from './script.js'; 

export function initKundeInfoPage(){
    tokenCheck()
    
    ladeKunden(); // Speisekarte sofort laden, wenn die Seite geladen wird
  
    function ladeKunden() {
        fetch("http://localhost:3000/kunden")
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector("#costumer-table tbody");
                tableBody.innerHTML = ""; // Vorherige Einträge löschen
    
                data.forEach(costumer => {
                    const row = `
                        <tr>
                            <td>${costumer.vorname}</td>
                            <td>${costumer.nachname}</td>                            
                            <td>${costumer.email}</td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            })
            .catch(error => console.error("Fehler beim Abrufen der Reservierungen:", error));
    }
    
}