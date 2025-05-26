import { showConfirmationPopup } from './script.js';
import { tokenCheck } from './script.js';




let currentTblData = {};
let currentGuestData = {};
let currentOrder = [];
let guestNr = 0;

export function initRoomManagerPage() {

  tokenCheck();
  //Menü-Button Funktionalität (Tab-Switch)
  
   
  
    document.getElementById("date").value = new Date().toISOString().split("T")[0];
    ladeReservierungen();
    getRooms();
    setTimeout(loadRoom, 200);
    setTimeout(checkTbl, 200);
    



//Funktionen zuweisen
    
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
    editModals();
    window.addEventListener("resize", scaleRoomContent);
    document.addEventListener("DOMContentLoaded", () => {
    scaleRoomContent();
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

function configTbl(tblNr, className, resID, seats){
  
  const room = document.getElementById("roomLabel").selectedOptions[0].text;
  
  currentTblData = {};

  currentTblData = {room, tblNr, resID, seats}

  switch(className){

      case 'table free':  // Tischzuweisung und Servicestart ohne Reservierung
                  
              document.getElementById("modRoNa").textContent = document.getElementById("roomLabel").selectedOptions[0].text;
  
              document.getElementById("modTblNr").textContent = tblNr; 
              document.getElementById("editModal").style.display = "flex";
            break;

      case 'table occupied-wait': // Servicestart mit Reservierung und Tisch entfernen  
                            
              document.getElementById("SmodRoNa").textContent = document.getElementById("roomLabel").selectedOptions[0].text;
    
              document.getElementById("SmodTblNr").textContent = tblNr;
  
              document.getElementById("resId").textContent = resID;                   
              document.getElementById("startModal").style.display ="flex";
            break;

      case 'table occupied-active': // Service abbrechen oder beenden -> Rechnung   
            
              document.getElementById("AmodRoNa").textContent = document.getElementById("roomLabel").selectedOptions[0].text;
    
              document.getElementById("AmodTblNr").textContent = tblNr;

              document.getElementById("AMresId").textContent = resID;                           
              
              document.getElementById("activeModal").style.display ="flex";

            break;
                    
  }
  
}
function editModals(){
    //Buttons ohne Reservierung
    document.getElementById("openTblBtn").addEventListener("click", () => {

    const {room, tblNr, seats} = currentTblData;
    startNewService(room, tblNr, seats);
    closeModal("editModal");

    });

    document.getElementById("resTblBtn").addEventListener("click", () => {
    updateReservation();
    closeModal("editModal");
    });

    document.getElementById("stopTblBtn").addEventListener("click",() =>{
    closeModal("editModal");
    });

    //Buttons mit Reservierung
    document.getElementById("SmodOpenTblBtn").addEventListener("click", () => {
      const {resID} = currentTblData;
      startService(resID);
      closeModal("startModal");
    });
    document.getElementById("SMresTblBtn").addEventListener("click", ()=>{
      const {resID} = currentTblData;
      delTblRes(resID);
      closeModal("startModal");
    });
    document.getElementById("SMstopTblBtn").addEventListener("click",() =>{
      closeModal("startModal");
    });

    //Buttons für aktive Tische
    document.getElementById("AMbreakTblBtn").addEventListener("click",() =>{
      const {resID} = currentTblData;
      breakService(resID);
      closeModal("activeModal");
    });

      document.getElementById("AMcloseTblBtn").addEventListener("click", ()=>{
        const {resID} = currentTblData;
      closeTable(resID);
      closeModal("activeModal");
    });

      document.getElementById("AMstopTblBtn").addEventListener("click",() =>{
      closeModal("activeModal");
    });
      document.getElementById("AMstartOrderBtn").addEventListener("click", () => {
        const {room, tblNr, resID} = currentTblData;
        const guests = currentTblData.seats;
        createOrder(resID);
        closeModal("activeModal");
        orderModal(room, tblNr, resID, guests);
      })           
    document.getElementById("orderModalCloseBtn").addEventListener("click", () =>{
      currentOrder = [];
      fillList();
      closeModal("orderModal");
      
    }); 
    //Bestell-Modal Eventlistener Buttons zuweisen  
    document.querySelectorAll(".dishBtn").forEach(btn =>{
      btn.addEventListener("click", () =>{
        document.querySelectorAll(".dishBtn").forEach(btns =>{
          btns.classList.remove("active");
        });
        btn.classList.add("active");
      });
    });
    document.getElementById("app").addEventListener("click", () =>{
      getMenu("appetizer");
    });
    document.getElementById("main").addEventListener("click", () =>{
      getMenu("mainCourse");
    });   
    document.getElementById("dess").addEventListener("click", () =>{
      getMenu("dessert");
    });   
    document.getElementById("coldDrinks").addEventListener("click", () =>{
      getMenu("coldDrinks");
      });   
  //  document.getElementById("hotDrinks").addEventListener("click", () =>{
  //    getMenu("appetizer");
  //  });
  
  document.querySelector("#dish-table").addEventListener("click", (event) => {
    if (event.target.classList.contains("dishBtns")) {
        const button = event.target;
        const guestId = currentGuestData.guestId; // Aktueller Gast
        const dishName = button.getAttribute("data-name");
        const dishPrice = button.getAttribute("data-price");
        const dishVariety = button.getAttribute("data-variety");
        if(guestId){
          addDishToList(guestId, dishName, dishPrice, dishVariety);
        }
        
    }
});
document.querySelector("#orderList").addEventListener("click", (event) => {
  if(event.target.classList.contains("delBtn")){
    const button = event.target;
    const guestId = button.getAttribute("data-guest-id");
    const index = button.getAttribute("data-index");
    console.log(index);

    // Entferne die Bestellung aus currentOrder
    currentOrder[guestId].splice(index, 1);

    // Falls der Gast keine Bestellungen mehr hat, lösche den Gast aus currentOrder
    if (currentOrder[guestId].length === 0) {
      delete currentOrder[guestId];
    }

    console.log(`Bestellung für Gast ${guestId} entfernt.`);
    console.log("Aktuelle Bestellungen:", currentOrder);

    // Aktualisiere die Tabelle
    fillList();
  }
});
document.getElementById("setOrderBtn").addEventListener("click", () =>{
  showConfirmationPopup("Bestellung absenden und beenden?")
  .then(() =>{
    addMultipleItems();
  })
  .catch(()=> {
    console.log("Aktion abgebrochen")
  })
});
document.getElementById("addGuest").addEventListener("click", () =>{
  addGuest();
})

}

    
  
function closeModal(modalId){
  document.getElementById(modalId).style.display = "none";
  guestNr = 0;
  
}
function ladeReservierungen() {
  const date = document.getElementById("date").value;
  console.log(date);
  fetch("http://192.168.91.68:3000/api/resDate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({date}),
      credentials: "include"
    }
  )
      .then(response => response.json())
      .then(data => {

          const tableBody = document.querySelector("#reservation-table tbody");
          tableBody.innerHTML = ""; // Vorherige Einträge löschen
          console.log(data);
          data.forEach(reservation => {
            const row = document.createElement("tr");
          
            row.innerHTML = `
              <td>${reservation.id}</td>
              <td>${reservation.name}</td>
              <td>${reservation.time}</td>
              <td >${reservation.guests}</td>
              <td class="btn">${reservation.room}</td>
              <td >${reservation.tblNr}</td>
            `;
          
            row.addEventListener("click", () => {
              document.getElementById("roomLabel").value = reservation.room;
              loadRoom();
              checkTbl();
            });
          
            tableBody.appendChild(row); //appendChild
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
  
      fetch("http://192.168.91.68:3000/api/checkTbl", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"              
            },
            credentials: "include",
            body: JSON.stringify({date, room})
      })
      .then(response => response.json())
      .then(selTbl => {
          selTbl.forEach(table => {
              const el = [...document.querySelectorAll("#roomLoad .table")].find(div => {
                return div.textContent.includes(`Tisch: ${table.tblNr}`);
              });
              if (el) {
                const tooltip = document.createElement("div");
                tooltip.className = "tooltip-box";
                tooltip.innerHTML = `${table.name}<br>${table.time} Uhr<br>${table.guests} Personen`;
                el.appendChild(tooltip);
                el.resID = table.id;
                el.seats = table.guests;
                console.log("ID:" ,table.id + " Aktiv:", table.active); 

                if(table.active){
                    el.classList.remove("free");
                    el.classList.add("occupied-active");
                  }else{
                    el.classList.remove("free");
                    el.classList.add("occupied-wait");                               
                  }
              }
          });
      }) 
      
      .catch(error => console.error("Fehler beim Servicecheck:", error));
    }
    function updateReservation(){
      const Id = document.getElementById("resSel").value;
      const room = document.getElementById("modRoNa").textContent;
      const tblNr = document.getElementById("modTblNr").textContent;
      console.log("TOKEN:", localStorage.getItem("token"));
      fetch("http://192.168.91.68:3000/api/updateReservation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",            
          },
          credentials: "include",
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
  function startNewService(room, tblNr, seats){
      const selectedDate = document.getElementById("date").value;
      const today = new Date();
      const todayString = today.toISOString().split("T")[0]; // gibt "YYYY-MM-DD" zurück

      if (selectedDate === todayString) {
        fetch("http://192.168.91.68:3000/api/startNewService", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
              
            },
            credentials: "include",
            body: JSON.stringify({room, tblNr, seats})
        })
      .then(response => response.json())
      .then(data =>{
        console.log("Service gestartet", data);
          ladeReservierungen();
          loadRoom();
          checkTbl();
      })
    .catch(error => console.error("Fehler beim Servicestart:", error));   
      }  
  }


    function startService(resID){
      const selectedDate = document.getElementById("date").value;
      const today = new Date();
      const todayString = today.toISOString().split("T")[0]; // gibt "YYYY-MM-DD" zurück

      if (selectedDate === todayString) {
        fetch("http://192.168.91.68:3000/api/startService", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"              
            },
            credentials: "include",
            body: JSON.stringify({resID})
        })
      .then(response => response.json())
      .then(data =>{
        console.log("Service gestartet", data);
        
        })
          loadRoom();
          checkTbl();
      } else{
      alert("Datum nicht aktuell!")
    }     
  }
    function delTblRes(resID){

      fetch("http://192.168.91.68:3000/api/delTblRes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"           
          },
          credentials: "include",
          body: JSON.stringify({resID})
    })
    .then(response => response.json())
    .then(data =>{
      console.log("Update erfolgreich:", data);
      ladeReservierungen();
      loadRoom();
      checkTbl();
      
    })

    }
    function breakService(resID){
      fetch("http://192.168.91.68:3000/api/breakService", {
        method: "POST",
        headers: {"Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({resID})
      })
      .then(response => response.json())
    .then(data =>{
      console.log("Service unterbrochen:", data);
      ladeReservierungen();
      loadRoom();
      checkTbl();
      
    })
    }
    
      function orderModal(room, tblNr, resID, guests){
        console.log(guests);
        
        document.getElementById("OMRoom").textContent = room;
    
        document.getElementById("OMTblNr").textContent = tblNr;
  
        document.getElementById("OMresId").textContent = resID;

        const table = document.getElementById("guests");
        table.innerHTML =""

        for(let i = 1; i <= guests; i++){
          const button = document.createElement("button");
          button.textContent =`Gast ${i}`;
          button.className = "guest-button";
          button.guestId = i;
          button.addEventListener("click", () =>{
            const guestId = button.guestId;
            const orderId = resID;
            currentGuestData ={};
            currentGuestData = {orderId, guestId};
            console.log(currentGuestData);
            openOrderHistory(resID, guestId);
           document.querySelectorAll(".guest-button").forEach(btn =>{
            btn.classList.remove("active");
           });
           button.classList.add("active"); //Button auf aktiv setzen

          document.getElementById("guestInOrder").textContent = `Gast ${button.guestId}`;
          });
          table.appendChild(button);
          guestNr++;
        }
        document.getElementById("orderModal").style.display = "flex";
      }
    function createOrder(resID){
      fetch("http://192.168.91.68:3000/api/createOrder", {
        method: "POST",
        headers: {"Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({orderId: resID})
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error =>{
        console.error("Fehler bim Erstellen der Bestellung", error);
      })
    }

    function openOrderHistory(){

      const {orderId, guestId} = currentGuestData;
      console.log("Historie für: ", currentGuestData);
      fetch("http://192.168.91.68:3000/api/getOrder", {
        method: "POST",
        headers: {"Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({orderId, guestId})
      })
      .then(response => response.json())
    .then(data =>{
      console.log("API-Antwort:", data); // Überprüfe die Struktur von data
    if (Array.isArray(data)) {
      const histList = document.querySelector("#histList tbody");
      histList.innerHTML="";
        data.forEach(order => {
          document.getElementById("guestHist").textContent = `Gast${guestId}: Historie`;
          const row = document.createElement("tr");

      // Erstelle die Zeile mit innerHTML
      row.innerHTML = `
        
        <td>${order.name}</td>
        <td class="price">${order.price} €</td>
        <td class="btn"><button class="delHistBtn">X</button></td>
      `;
            histList.appendChild(row);

            const delBtn = row.querySelector(".delHistBtn");
            delBtn.addEventListener("click", () => {
              removeItem(order); // Übergib das Objekt direkt
              openOrderHistory();
            });
        });
    } else {
        document.getElementById("guestHist").textContent = `Gast${guestId}`;
        const histList = document.querySelector("#histList tbody");
        histList.innerHTML="";
        console.error("Die API-Antwort ist kein Array:", data);
    }
    })
    
    }
    function getMenu(sort){

      fetch("http://192.168.91.68:3000/api/dishSelection", {
        method: "POST",
        headers: {"Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({sort})
      })
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
            const dishBody = document.querySelector("#dish-table tbody");
            dishBody.innerHTML = ""; // Vorherige Inhalte löschen
    
            data.forEach(dish => {
                // Erstelle die Zeile
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td >${dish.name}</td>
                    <td class="price">${dish.price} €</td>
                    <td class="btn"><button class="dishBtns" data-name="${dish.name}" data-price="${dish.price}" data-variety = ${dish.variety}>&rarr;</button></td>
                `;
    
                // Füge Zeile in die Tabelle ein
                dishBody.appendChild(row);
            });
        }
        ensureMinimumRows("dish-table", 8);
    })
      .catch(error => console.error("Fehler beim Aufrufen der Gerichte:", error));
    }
 function addDishToList(guestId, name, price, variety){
   // Überprüfe, ob der Gast bereits existiert
   if (!currentOrder[guestId]) {
        currentOrder[guestId] = []; // Neues Array für den Gast erstellen
  }

  // Füge die Bestellung zum Gast hinzu
  currentOrder[guestId].push({ name, price, variety });
  console.log(`Bestellung für Gast ${guestId} hinzugefügt:`, { name, price, variety });
  console.log("Aktuelle Bestellungen:", currentOrder);
  fillList();
  
}
function fillList() {
  const orderBody = document.querySelector("#orderList tbody");
  orderBody.innerHTML = ""; // Vorherige Inhalte löschen

  Object.entries(currentOrder).forEach(([guestId, orders]) => {
    orders.forEach((order, index) => {
      const row = document.createElement("tr");

      // Erstelle die Zeile mit innerHTML
      row.innerHTML = `
        <td>Gast ${guestId}</td>
        <td>${order.name}</td>
        <td class="price">${order.price} €</td>
        <td class="btn"><button class="delBtn" data-guest-id="${guestId}" data-index="${index}">X</button></td>
      `;

      // Füge die Zeile in den Tabellenkörper ein
      orderBody.appendChild(row);
    });
    
  });
  
}
     
function ensureMinimumRows(tableId, minRows) {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  const currentRows = tableBody.querySelectorAll("tr").length;

  for (let i = currentRows; i < minRows; i++) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
          <td colspan="3">&nbsp;</td> <!-- Leere Zelle -->
      `;
      tableBody.appendChild(emptyRow);
  }
}
function addMultipleItems(){

  const orderId = currentGuestData.orderId;
  const guestsObj = currentOrder;
  fetch("http://192.168.91.68:3000/api/addMultipleItems", {
    method: "POST",
    headers: {"Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({orderId, guestsObj})
  })
  .then(response => response.json())
  .then(data =>{
    console.log(data);
    currentOrder = [];
    fillList();
    closeModal("orderModal");
    closeModal("activeModal");
  })
  .catch(error =>{
    console.error("Fehler beim Übertragen der Bestellung", error);
  })
  }
function removeItem(dataItem){
  const orderId = currentGuestData.orderId;
  const guestId = currentGuestData.guestId;
  const item = dataItem;
  console.log("OrderID:", orderId, "guestId:", guestId, "Item:", item);
  fetch("http://192.168.91.68:3000/api/removeItem",{
    method: "POST",
    headers: {"Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({orderId, guestId, item})
  })
  .then(response => response.json())
  .then(data =>{
    console.log("Antwort", data);
  })
  .catch(error =>{
    console.error("Fehler beim Löschen des Artikels", error);
  })

}
function addGuest(){
  showConfirmationPopup("Gast hinzufügen?")
  .then(()=>{
  const resStr = document.getElementById("OMresId").textContent;
  const resID = parseInt(resStr);
  console.log("resID:", resID);

  fetch("http://192.168.91.68:3000/api/addGuest", {
    method: "POST",
    headers: {"Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({resID})
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP-Fehler! Status: ${response.status}`);
    }
    return response.json();
  
  })
  .then(data =>{
    console.log(data)
    guestNr++;
    const guestId = guestNr;
    const table = document.getElementById("guests");
    const button = document.createElement("button");
          button.textContent =`Gast ${guestNr}`;
          button.className = "guest-button";
          button.guestId = guestId;
          button.addEventListener("click", () =>{
            const guestId = button.guestId;
            const orderStr = document.getElementById("OMresId").textContent;
            const orderId = parseInt(orderStr);
            currentGuestData ={};
            currentGuestData = {orderId, guestId};
            console.log(currentGuestData);
            openOrderHistory(orderId, guestId);
           document.querySelectorAll(".guest-button").forEach(btn =>{
            btn.classList.remove("active");
           });
           button.classList.add("active"); //Button auf aktiv setzen

          document.getElementById("guestInOrder").textContent = `Gast ${button.guestId}`;
          });
          table.appendChild(button);
          
    
    
  })
  .catch(error =>{
    console.error("Fehler beim Hinzufügen des Gastes", error);
  })
})
.catch(()=>{
  console.log("Aktion abgebrochen");
})
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
