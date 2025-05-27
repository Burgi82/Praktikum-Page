
import { tokenCheck } from './script.js';  
import { showConfirmationPopup } from './script.js';
let activeTable = null; 
let tableId = 0;
let resizeId = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;


export function initAdmiPage(){
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
            getRooms();
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

