import { tokenCheck } from './script.js';   


export function initAdminPage(){
    tokenCheck();
    ladeReservierungen(); // Reservierungen sofort laden, wenn die Seite geladen wird
   
    ["btnTab1", "btnTab2", "btnTab3"].forEach((btnId, index) => {
        document.getElementById(btnId).addEventListener("click", () => {
          showTab(`tab${index + 1}`);
        });
    });

    document.getElementById("admin-form").addEventListener("submit", async function(event) {
        event.preventDefault();
    
        const formData = new FormData(event.target);
        
    
        fetch("http://localhost:3000/api/speisekarte", {
            method: "POST",
            headers: {"Authorization": `Bearer ${window.token}`},
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Neues gericht wurde hinzugefügt!");
            event.target.reset();
        })
        .catch(error => console.error("Fehler!", error));
    });
    
       
    document.getElementById("delete-selected").addEventListener("click", async() => {
        const checkedBoxes = document.querySelectorAll(".done-checkbox:checked");
    
        if(checkedBoxes.length === 0){
            alert("keine Reservierung ausgewählt!");
            return;
        }
    
        const confirmDelete = confirm("Möchtest du die ausgewählten Reservierungen löschen?");
        if(!confirmDelete) return;
    
        for(const box of checkedBoxes){
            const id = box.dataset.id;
    
            try{
                const response = await fetch("http://localhost:3000/api/reservierungen/loeschen",{
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.token}`
                },
                body: JSON.stringify({id})
            });
            const result = await response.json();
            console.log("✅", result.message);
            }catch(error){
            console.error("Fehler beim Löschen der Reservierung:", error);
            }
        }

    });
       
}
function showTab(id) {
    document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
    
    const selectedTab = document.getElementById(id);
    selectedTab.style.display = 'block';
    
    if(id === "tab1"){
        ladeReservierungen();
    }
  }
function ladeReservierungen() {
    fetch("http://localhost:3000/api/reservierungen")
        .then(response => response.json())
        .then(data => {

            data.sort((a, b) => new Date(a.date) - new Date(b.date));


            const tableBody = document.querySelector("#reservation-table tbody");
            tableBody.innerHTML = ""; // Vorherige Einträge löschen

            data.forEach(reservation => {
                const row = `
                    <tr>
                        <td>${reservation.id}</td>
                        <td>${reservation.name}</td>
                        <td>${reservation.email}</td>
                        <td>${formatDate(reservation.date)}</td>
                        <td>${reservation.time}</td>
                        <td>${reservation.guests}</td>
                        <td>${reservation.room}</td>
                        <td>${reservation.tblNr}</td>
                        <td><input type="checkbox" class="done-checkbox" data-id="${reservation.id}"></td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            })
        })
        .catch(error => console.error("Fehler beim Abrufen der Reservierungen:", error));
}
function formatDate(isoDate) {
    const dateObj = new Date(isoDate);
    const day = String(dateObj.getDate()).padStart(2, '0');  // Tag zweistellig
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Monat zweistellig
    const year = dateObj.getFullYear(); // Jahr bleibt unverändert

    return `${day}.${month}.${year}`;
}

