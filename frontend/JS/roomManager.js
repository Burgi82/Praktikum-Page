



export function initRoomManagerPage() {
    waitForElement("#addTableBtn", (btn) => {
      btn.addEventListener("click", addTable);
    });
    waitForElement("#save", (btn) => {
      btn.addEventListener("click", saveRoom);
    });
    
    waitForElement("#room", (room) => {
        room.addEventListener("dragover", allowDrop);
        room.addEventListener("drop", drop);
    });
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

function addTable() {  //Tisch erzeugen
  const table = document.createElement("div");
  table.className = "table free";
  table.draggable = true;
  table.id = `table-${tableId++}`;
  table.textContent = "2 P";
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

  document.getElementById("room").appendChild(table);
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const table = document.getElementById(data);

  const roomRect = ev.currentTarget.getBoundingClientRect();
  const x = ev.clientX - roomRect.left;
  const y = ev.clientY - roomRect.top;

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

  const personCount = Math.max(1, Math.round((newWidth + newHeight) / 80));
  activeTable.firstChild.textContent = `${personCount} P`;
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
    const parentRect = document.getElementById("room").getBoundingClientRect();
    const relativeLeft = rect.left - parentRect.left;
    const relativeTop = rect.top - parentRect.top;
    

    return{
      id: table.id,
      left: relativeLeft,
      top: relativeTop,
      width: table.offsetWidth,
      height: table.offsetHeight,
      seats: parseInt(table.firstChild.textContent) || 2
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
            
        })
        .catch(error => console.error("Fehler!", error));
  
  

}