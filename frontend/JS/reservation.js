import { tokenCheck } from './script.js';    
    
export function initReservationPage(){
    tokenCheck();
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
        const isMondayOrTuesday = dayOfWeek === 1 || dayOfWeek === 2;

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

        fetch("http://localhost:3000/reservierungen", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
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
    