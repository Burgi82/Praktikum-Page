export function initRoomManagerPage() {
    waitForElement("#addTableBtn", (btn) => {
      btn.addEventListener("click", addTable);
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

function addTable() {
  const table = document.createElement("div");
  table.className = "table free";
  table.draggable = true;
  table.id = `table-${tableId++}`;
  table.textContent = "4 P";

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

