
import { tokenCheck } from './script.js';

export function initReservationPage(){
    tokenCheck();
    getRooms();
    
        fetch("http://localhost:3000/api/getUser",{
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.token}`,
            }            
        })
            .then(response => response.json())
            .then(data => {
               
                const vorname = data.vorname;
                const nachname = data.nachname;
                const email = data.email;
        
                const nameElement = document.getElementById("name");
                const emailElement = document.getElementById("email");
                nameElement.textContent = vorname +" " + nachname  || "Name nicht gefunden!";
                emailElement.textContent = email || "E-Mail nicht gefunden!";
                document.getElementById("hidden-name").value = vorname + " " + nachname;
                document.getElementById("hidden-email").value = email;
                
                
            })

  
    
    
    
    
    
    const dateInput = document.getElementById("date");
    const submitButton = document.getElementById("submit-button");
    const select = document.getElementById("time-select");

    function generateTimeOptions(startHour, endHour, stepMinutes) {
        const options = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minutes = 0; minutes < 60; minutes += stepMinutes) {
                const time = new Date();
                time.setHours(hour, minutes);

                const hh = String(time.getHours()).padStart(2, "0");
                const mm = String(time.getMinutes()).padStart(2, "0");
                const timeStr = `${hh}:${mm}`;

                // Nur Zeiten <= 21:00 einfügen
                if (hour < endHour || (hour === endHour && minutes === 0)) {
                    options.push(timeStr);
                }
            }
        }
        return options;
    }
    document.getElementById("roomLabel").addEventListener("change", ()=>{loadRoom();
        setTimeout(checkTbl, 200);
    });
    document.getElementById("date").addEventListener("change", ()=>{loadRoom();
        setTimeout(checkTbl, 200);
    });
    const timeOptions = generateTimeOptions(17, 21, 15); // Start: 17:00, Ende: 21:00, Step: 15 min
    
    timeOptions.forEach(time => {
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        select.appendChild(option);
    });
    // Die Anfangs-Button-Status (deaktiviert)
    submitButton.disabled = true;

    // Überprüfung des Datums während der Eingabe (input event)
    dateInput.addEventListener("input", function () {
        validateForm(); // Validierung bei Eingabe
    });

 
    

    // Validierungsfunktion
    function validateForm() {
        const selectedDate = new Date(dateInput.value); // Das ausgewählte Datum
       
        const dayOfWeek = selectedDate.getDay(); // Wochentag (0 = Sonntag, 1 = Montag, ..., 6 = Samstag)

        // Feiertage
        const holidays = [
            '2025-01-01', // Neujahr
            '2025-12-25'  // Weihnachten
        ];

        const formattedDate = selectedDate.toISOString().split('T')[0]; // Datum im Format YYYY-MM-DD
        const isHoliday = holidays.includes(formattedDate); // Prüfen, ob das Datum ein Feiertag ist

        // Überprüfen, ob Montag oder Dienstag und kein Feiertag
        const isMondayOrTuesday = dayOfWeek === 1; // || dayOfWeek === 2;

        // Überprüfen, ob das Datum gültig ist (Montag oder Dienstag nur, wenn es ein Feiertag ist)
        if (isMondayOrTuesday && !isHoliday) {
            dateInput.setCustomValidity("Montag und Dienstag sind nicht verfügbar, es sei denn, es ist ein Feiertag.");
            document.getElementById("error-message").style.display = "block";
        } 
      
        
        else {
            dateInput.setCustomValidity(""); // Gültiges Datum zurücksetzen
            document.getElementById("error-message").style.display = "none";
        }

        // Überprüfen, ob die Uhrzeit innerhalb des erlaubten Rahmens liegt (17:00 - 21:00)
       

        // Wenn beide Eingaben gültig sind, Submit-Button aktivieren
        if (!dateInput.validationMessage ) {
            submitButton.disabled = false; // Button aktivieren
        } else {
            submitButton.disabled = true; // Button deaktivieren
        }
    }

    // Formular Absenden (mit Validierung)
    document.getElementById("reservation-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Verhindert das Standardformularverhalten

        // Hier wird der Code für das Absenden des Formulars übernommen
        const formData = new FormData(event.target);
        const jsonData = Object.fromEntries(formData.entries());
        console.log(jsonData);
        fetch("http://localhost:3000/api/reservierungen", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${window.token}`
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Reservierung gespeichert!");
            event.target.reset(); // Formular zurücksetzen
            submitButton.disabled = true; // Button zurücksetzen (deaktivieren)
        })
        .catch(error => console.error("Fehler!", error));
    });
 } 
 
 
 function getRooms(){

  
 

    fetch("http://localhost:3000/api/getRoomNames")
     
  .then(response => response.json())
  .then(rooms => {
    const select = document.getElementById("roomLabel");
    select.innerHTML="";
    const placeholder = document.createElement("option");
    placeholder.text = "Raum auswählen...";
    placeholder.value = "";
    placeholder.disabled = "true";
    placeholder.selected = "true";
    select.appendChild(placeholder);

      rooms.forEach(room =>{
        const option = document.createElement("option");
        option.value = room.name;
        option.textContent = room.name;
        select.appendChild(option);
      });    
  })
  .catch(error => console.error("Fehler!", error));
}
function loadRoom(){
    const name = document.getElementById("roomLabel").value;
    
    fetch("http://localhost:3000/api/loadRoom", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({name})
    })
    .then(response => response.json())
    .then(data => {
      const tablesArray = JSON.parse(data[0].tables);
  
      console.log(tablesArray);
      document.getElementById("roomLoad").innerHTML="";
      tablesArray.forEach(t =>{
        recreateTable(t);
      })
      scaleRoomContent();
    })
    .catch(error => console.error("Fehler!", error));
}
function recreateTable(data) {
    const table = document.createElement("div");
    table.className = "table free";
    table.id = data.id;
    table.style.left = data.left + "px";
    table.style.top = data.top + "px";
    table.style.width = data.width + "px";
    table.style.height = data.height + "px";
    table.textContent = `${data.seats} P \n Tisch: ${data.tblNr}`;
    table.addEventListener("click", () => {
      selectTbl(data.tblNr, table.className);
    });
    document.getElementById("roomLoad").appendChild(table);
  }



  function selectTbl(tblNr, className){
    if(className == "table occupied-wait")return;
    const room = document.getElementById("roomLabel").value;
    document.getElementById("hidden-tblNr").value = tblNr;
    document.getElementById("hidden-room").value = room;
    document.getElementById("tblSelect").textContent = `${room} Tisch:${tblNr}`;
  }



  function checkTbl(){
    const date = document.getElementById("date").value;
    const room = document.getElementById("roomLabel").value;

    if(!date || !room) return;

    fetch("http://localhost:3000/api/checkTbl", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${window.token}`
          },
        body: JSON.stringify({date, room})
    })
    .then(response => response.json())
    .then(selTbl => {
        selTbl.forEach(table => {
            const el = [...document.querySelectorAll("#roomLoad .table")].find(div => {
              return div.textContent.includes(`Tisch: ${table.tblNr}`);
            });
            if (el) {
              el.classList.remove("free");
              el.classList.add("occupied-wait");
            }
        });
    }) 
    .catch(error => console.error("Fehler beim Belegungscheck:", error));
  }
  function scaleRoomContent(){
    const roomLoad = document.getElementById("roomLoad");
    const parentWidth = roomLoad.parentElement.offsetWidth;
    const parentHeight = roomLoad.parentElement.offsetHeight;
    const contentWidth = roomLoad.scrollWidth;
    const contentHeight = roomLoad.scrollHeight;
  
    const scaleFactor = parentWidth / contentWidth;
    const scaleFactorHeight = parentHeight / contentHeight;
  
    roomLoad.style.transform = `scale(${Math.min(scaleFactor,scaleFactorHeight, 1)})`;
    
     
  }