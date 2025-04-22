export function initRoomManagerPage() {
  //Menü-Button Funktionalität (Tab-Switch)
  function showTab(id) {
    document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(id == "tab2"){
      loadRoom();
    }
    
    
  };
  ["btnTab1", "btnTab2", "btnTab3"].forEach((btnId, index) => {
    document.getElementById(btnId).addEventListener("click", () => {
      showTab(`tab${index + 1}`);
      
    });
});
getRooms();



//Funktionen zuweisen
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
    document.getElementById("roomLabel").addEventListener("change", ()=>{loadRoom();
      setTimeout(checkTbl, 200);
    });
    document.getElementById("date").addEventListener("change", () => {
      loadRoom();
      setTimeout(() => {
          checkTbl();
          ladeReservierungen();
      }, 200);
    });
    document.getElementById("resTblBtn").addEventListener("click", () => {
      updateReservation();
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
let tableId = 0;
let resizeId = 0;
let activeTable = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function addTable() {  //Tisch erzeugen
  const table = document.createElement("div");
  table.dataset.tblNr = tableId+1;
  table.className = "table new";
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

  document.getElementById("roomSave").appendChild(table);
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

  const personCount = Math.max(1, Math.round((newWidth /80)+ (newHeight / 80)));
  activeTable.firstChild.textContent = `${personCount} P \n Tisch: ${tableId}`;
}
function stopResize() {
  window.removeEventListener('mousemove', resize);
  window.removeEventListener('mouseup', stopResize);
  activeTable = null;
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
async function saveRoom(){
  const roomData = getRoomState();
  console.log(roomData);

  fetch("http://localhost:3000/api/createRoom", {
    method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(roomData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Neuer Raum wurde hinzugefügt!");
            document.getElementById("roomSave").innerHTML=""; 
            getRooms();
        })
        .catch(error => console.error("Fehler!", error));

  
}

function getRooms(){

  
 

  fetch("http://localhost:3000/api/getRoomNames")
   
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
    
  })
  .catch(error => console.error("Fehler!", error));
  
  //Tische für Raum laden:
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
      configTbl(data.tblNr);
    });
    document.getElementById("roomLoad").appendChild(table);
  }
}
function configTbl(tblNr){
  const modal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  document.getElementById("modRoNa").textContent = document.getElementById("roomLabel").selectedOptions[0].text;
  document.getElementById("modTblNr").textContent = tblNr;
  document.getElementById("stopTblBtn").addEventListener("click",() =>{
    modal.style.display = "none";
  });
  modal.style.display = "flex";
}
function ladeReservierungen() {
  const date = document.getElementById("date").value;
  console.log(date);
  fetch("http://localhost:3000/api/resDate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({date})
    }
  )
      .then(response => response.json())
      .then(data => {

          const tableBody = document.querySelector("#reservation-table tbody");
          tableBody.innerHTML = ""; // Vorherige Einträge löschen
          console.log(data);
          data.forEach(reservation => {
              const row = `
                  <tr>
                      <td>${reservation.id}</td>
                      <td>${reservation.name}</td>
                      <td>${reservation.time}</td>
                      <td>${reservation.guests}</td>
                      <td>${reservation.room}</td>
                      <td>${reservation.tblNr}</td>
                    
                  </tr>
              `;
              tableBody.innerHTML += row;
          });

          const select = document.getElementById("resSel");
          select.innerHTML="";
          data.forEach(reservation => {
            if(reservation.tblNr == 0){
              const option = document.createElement("option");
              option.value = reservation.id;
              option.textContent = reservation.id+"\t"+reservation.name;
              select.appendChild(option);
            };
            
          });
      })
      .catch(error => console.error("Fehler beim Abrufen der Reservierungen:", error));
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
                el.classList.add("occupied");
              }
          });
      }) 
      .catch(error => console.error("Fehler beim Belegungscheck:", error));
    }
    function updateReservation(){
      const Id = document.getElementById("resSel").value;
      const room = document.getElementById("modRoNa").textContent;
      const tblNr = document.getElementById("modTblNr").textContent;
      fetch("http://localhost:3000/api/updateReservation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${window.token}`
          },
        body: JSON.stringify({Id, room, tblNr})
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Serverfehler");
      }
      return response.json(); // Falls der Server etwas zurückgibt
    })
    .then(data => {
      console.log("Update erfolgreich:", data);
      ladeReservierungen();
      loadRoom();
      checkTbl();
      // z. B. Erfolgsmeldung anzeigen oder UI refreshen
    })
    .catch(error => {
      console.error("Fehler beim Update:", error);
      alert("Update fehlgeschlagen.");
    });
    
    }