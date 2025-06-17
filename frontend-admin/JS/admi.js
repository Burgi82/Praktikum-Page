
import { tokenCheck } from './script.js';  
import { showConfirmationPopup } from './script.js';

let activeTable = null; 
let tableId = 0;
let resizeId = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;
let billCache = [];

export function initAdmiPage(){
    window.removeEventListener("resize", scaleRoomContent);
    tokenCheck();
    ladeReservierungen(); // Reservierungen sofort laden, wenn die Seite geladen wird
    
    ["btnTab1", "btnTab2", "btnTab3","btnTab4","btnTab5"].forEach((btnId, index) => {
        document.getElementById(btnId).addEventListener("click", () => {
          showTab(`tab${index + 1}`);
          if(btnId==="btnTab4"){
              
            loadRoom();
            getRooms();
          }
          if(btnId ==="btnTab5"){
          getbill();
          setPrintBtns();

          }
        });
    });
        getRooms(); 
        document.getElementById("roomLabel").addEventListener("change", ()=>{
         loadRoom();
          
        });

        document.getElementById("admin-form").addEventListener("submit", async function(event) {
        event.preventDefault();
    
        const formData = new FormData(event.target);
        const allergens = [];
        document.querySelectorAll('input[name="allergene"]:checked').forEach(cb =>{
          allergens.push(cb.value);
        })
        formData.append("allergens", allergens.join(","));
    
        fetch("http://192.168.91.68:3000/api/speisekarte", {
            method: "POST",
            credentials: "include",
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
                const response = await fetch("http://192.168.91.68:3000/api/reservierungen/loeschen",{
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({id})
            });
            const result = await response.json();
            console.log("✅", result.message);
            }catch(error){
            console.error("Fehler beim Löschen der Reservierung:", error);
            }
        }
        ladeReservierungen();

    });
    waitForElement("#addTableBtn", (btn) => {
      btn.addEventListener("click", addTable);
    });
    waitForElement("#save", (btn) => {
      btn.addEventListener("click", saveRoom);
    });
    
    waitForElement("#roomSave", (room) => {
        room.addEventListener("dragover", allowDrop);
        room.addEventListener("drop", drop);
    });
    waitForElement("#delRoomBtn", (btn) =>{
      btn.addEventListener("click", deleteRoom)
    })
    window.addEventListener("resize", scaleRoomContent);
    document.addEventListener("DOMContentLoaded", () => {
    scaleRoomContent();
    });
       
}
function showTab(id) {
    document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
    
    const selectedTab = document.getElementById(id);
    selectedTab.style.display = 'block';
    
    if(id === "tab1"){
        ladeReservierungen();
    }else if(id === "tab2"){
      buildAllergens();
    }
  }
function ladeReservierungen() {
    fetch("http://192.168.91.68:3000/api/reservierungen")
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
function addTable() {  //Tisch erzeugen
  const table = document.createElement("div");
  console.log("TEST CLICK");
  table.dataset.tblNr = tableId+1;
  table.className = "table newTable";
  table.draggable = true;
  table.id = `table-${tableId++}`;
  table.textContent = "2 P \n Tisch:"+tableId;
  
  const resizer = document.createElement("div");
    resizer.className = "resizer";
    resizer.id = `resizer-${resizeId++}`;
    resizer.textContent = "+";
    resizer.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startResize(e, table);
    });
  table.appendChild(resizer);
  table.addEventListener("dragstart", drag);


  // Standard-Position
  table.style.left = "10px";
  table.style.top = "10px";
  const roomSave = document.getElementById("roomSave")
  roomSave.appendChild(table);
  console.log("Tisch wurde hinzugefügt:", table,roomSave);
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  const table = ev.target;
  const rect = table.getBoundingClientRect();

  dragOffsetX = ev.clientX - rect.left;
  dragOffsetY = ev.clientY - rect.top;

  console.log("drag started:", ev.target.id); // zu Testzwecken
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const table = document.getElementById(data);

  const roomRect = ev.currentTarget.getBoundingClientRect();
  const x = ev.clientX - roomRect.left - dragOffsetX;
  const y = ev.clientY - roomRect.top - dragOffsetY;

  table.style.left = x + "px";
  table.style.top = y + "px";
}
function startResize(e, table) { //Skalierung starten
  activeTable = table;
  window.addEventListener("mousemove", resize);
  window.addEventListener("mouseup", stopResize);
}
function resize(e) {
  if (!activeTable) return;

  const rect = activeTable.getBoundingClientRect();
  const newWidth = e.clientX - rect.left;
  const newHeight = e.clientY - rect.top;

  activeTable.style.width = newWidth + "px";
  activeTable.style.height = newHeight + "px";

  const personCount = Math.max(1, Math.round((newWidth / 80)+ (newHeight / 80)));
  activeTable.firstChild.textContent = `${personCount} P \n Tisch: ${tableId}`;
}
function stopResize() {
  window.removeEventListener('mousemove', resize);
  window.removeEventListener('mouseup', stopResize);
  activeTable = null;
}
async function saveRoom(){
  showConfirmationPopup(`Neuen Gastraum unter ${document.getElementById("roomName").value} anlegen?`)
    .then(()=>{
      const roomData = getRoomState();
  console.log(roomData);

  fetch("http://192.168.91.68:3000/api/createRoom", {
    method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(roomData),
            credentials: "include"
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Neuer Raum wurde hinzugefügt!");
            document.getElementById("roomSave").innerHTML=""; 
            
        })
        .catch(error => console.error("Fehler!", error));
      })
      .catch(()=>{
        console.log("Aktion abgebrochen");
      })
  
}
  function waitForElement(selector, callback, timeout = 3000) {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      return;
    }
  
    const observer = new MutationObserver((mutations, obs) => {
      const el = document.querySelector(selector);
      if (el) {
        callback(el);
        obs.disconnect();
      }
    });
  
    observer.observe(document.body, { childList: true, subtree: true });
  
    // optional: Timeout-Fallback
    setTimeout(() => observer.disconnect(), timeout);
}



function getRoomState(){
  const tables = Array.from(document.querySelectorAll(".table"));
  const roomName = document.getElementById("roomName").value;
  const roomData = tables.map(table=>{
    const rect = table.getBoundingClientRect();
    const parentRect = document.getElementById("roomSave").getBoundingClientRect();
    const relativeLeft = rect.left - parentRect.left;
    const relativeTop = rect.top - parentRect.top;
    

    return{
      id: table.id,
      left: relativeLeft,
      top: relativeTop,
      width: table.offsetWidth,
      height: table.offsetHeight,
      seats: parseInt(table.firstChild.textContent) || 2,
      tblNr: parseInt(table.dataset.tblNr) || 2
    };
  });
const allTables = JSON.stringify(roomData);
  return {
    name : roomName,
    tables: allTables
  };
}
function buildAllergens(){
  const allerg = document.getElementById("allergens");
  allerg.innerHTML = "";
  const allergens = [
  "Getreide", "Weizen", "Dinkel", "Khorasan-Weizen",
    "Roggen", "Gerste", "Hafer", "Krebstiere", "Eier", "Fische", "Erdnüsse",
    "Sojabohnen", "Milch", "Mandeln", "Haselnüsse", "Walnüsse",
    "Kaschunüsse", "Pecannüsse", "Paranüsse", "Pistazien",
    "Macadamianüsse", "Queenslandnüsse", "Sellerie",
    "Senf", "Sesamsamen", "Schwefeldioxid", "Sulphite", "Lupinen", "Weichtiere"
];
  allergens.sort();
  allergens.forEach(a => {
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox"
    box.name = "allergene";
    box.value = a;
    label.appendChild(box);
    label.appendChild(document.createTextNode(" "+a));
    allerg.appendChild(label);
    allerg.appendChild(document.createElement("br"));    
  });

}
function getRooms(){

  fetch("http://192.168.91.68:3000/api/getRoomNames")
   
.then(response => response.json())
.then(rooms => {
  const select = document.getElementById("roomLabel");
  select.innerHTML="";
    rooms.forEach(room =>{
      const option = document.createElement("option");
      option.value = room.name;
      option.textContent = room.name;
      select.appendChild(option);
    });
     if (rooms.length > 0) {
        select.selectedIndex = 0;
      }    
})
.catch(error => console.error("Fehler!", error));
  
}
function loadRoom(){
  const name = document.getElementById("roomLabel").value;
  document.getElementById("roomLoad").style.display = "block";
  
  fetch("http://192.168.91.68:3000/api/loadRoom", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name}),
    credentials: "include"
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
  
  //Tische für Raum laden:
  function recreateTable(data) {
    const table = document.createElement("div");
    table.resID = 0;
    table.className = "table free";
    table.id = data.id;
    table.seats = data.seats;
    table.style.left = data.left + "px";
    table.style.top = data.top + "px";
    table.style.width = data.width + "px";
    table.style.height = data.height + "px";
    table.textContent = `${data.seats} P \n Tisch: ${data.tblNr}`;
    table.addEventListener("click", () => {
      configTbl(data.tblNr, table.className, table.resID, table.seats);
    });
    document.getElementById("roomLoad").appendChild(table);
  }
}
function scaleRoomContent() {
  const roomLoad = document.getElementById("roomLoad");
  if (!roomLoad) {
    console.error("roomLoad wurde nicht gefunden");
    return;
  }

  const parentWidth = roomLoad.parentElement.offsetWidth;
  const parentHeight = roomLoad.parentElement.offsetHeight;
  const contentWidth = roomLoad.scrollWidth;
  const contentHeight = roomLoad.scrollHeight;

  console.log("Raumgrößen:", { parentWidth, parentHeight, contentWidth, contentHeight });

  const scaleFactor = parentWidth / contentWidth;
  const scaleFactorHeight = parentHeight / contentHeight;

  console.log("Skalierungsfaktoren:", { scaleFactor, scaleFactorHeight });

  roomLoad.style.transform = `scale(${Math.min(scaleFactor, scaleFactorHeight, 1)})`;
  console.log("Skalierung angewendet");
}
function deleteRoom(){
  const select = document.getElementById("roomLabel");
  const roomName = select.options[select.selectedIndex].text;
  showConfirmationPopup(`Wollen Sie ${roomName} wirklich löschen?`)
  .then(()=>{
   fetch("http://192.168.91.68:3000/api/deleteRoom", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name: roomName}),
    credentials: "include"
  })
  .then(response => response.json())
  .then(data => {
        alert(data.message || "Raum wurde gelöscht!");
        document.getElementById("roomLoad").innerHTML=""; 
        getRooms();
        })
        .catch(error => console.error("Fehler!", error));
      
    });
  }
  function getbill() {
    fetch("http://192.168.91.68:3000/api/getBills")
        .then(response => response.json())
        .then(data => {
            billCache = data; // zwischenspeichern

            data.sort((a, b) => new Date(a.date) - new Date(b.date));

            const tableBody = document.querySelector("#bill-table tbody");
            tableBody.innerHTML = "";

            data.forEach((bill, index) => {
                const row = `
                    <tr>
                        <td>${bill.orderId}</td>
                        <td>${bill.room}</td>
                        <td>${bill.tblNr}</td>
                        <td>${bill.email}</td>
                        <td>${formatDate(bill.time)}</td>
                        <td>${bill.totalPrice} €</td>                  
                        <td><button class="print Btn" data-index="${index}">drucken</button></td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

            setPrintBtns(); // Buttons nach dem Rendern aktivieren
        })
        .catch(error => console.error("Fehler beim Abrufen der Rechnungen:", error));
}
function billPrev(bill){
  const {orderId, room, tblNr, Bill_ID} = bill;
  let gerichteText = "";
  let gerichte;

  // Wenn bill.items ein String ist, in ein Array umwandeln
  try {
    gerichte = typeof bill.items === "string" ? JSON.parse(bill.items) : bill.items;
  } catch (e) {
    console.error("Fehler beim Parsen von items:", e);
    return;
  }
  console.log("gerichteListe:", gerichte);
  gerichte.forEach(g =>
  gerichteText += `${g.name.padEnd(20)} ${parseFloat(g.price).toFixed(2).padStart(6)} €\n`
);

const gesamtpreis = gerichte.reduce((sum, g) => sum + parseFloat(g.price), 0).toFixed(2);

// Rechnung als Text
const rechnungText = 
`Rechnungsnummer     ${Bill_ID}
============================

Bestellung:          ${orderId}
Raum:                ${room}
Tisch:               ${tblNr}

----------------------------
Gericht               Preis
----------------------------
${gerichteText}----------------------------
Gesamtpreis:          ${gesamtpreis} €

Vielen Dank für Ihren Besuch!
Wir freuen uns auf ein Wiedersehen.
`;

// In ein Textfeld einfügen
document.getElementById("preview").value = rechnungText;
  
}
function setPrintBtns() {
    document.querySelectorAll(".print.Btn").forEach(btn => {
        const index = btn.dataset.index;
        btn.addEventListener("click", () => {
            billPrev(billCache[index]);
        });
    });
}