
import { tokenCheck } from './script.js';  
import { showConfirmationPopup } from './script.js';
import { addSocketListener, removeSocketListener } from "./socketManager.js";



export function initBarPage() {
  tokenCheck();
  getTodayOrders();

  // Definiere Listener-Funktion
  function onMessage(event) {
    const data = JSON.parse(event.data);
    console.log("Eingehende Daten:", data);
    if (data.type === "new-order") {
      console.log("Neue Bestellung:", data.data);
      updateOrderBox(data.data);
    }
  }
  
  // Listener hinzufügen
  addSocketListener(onMessage);

  // Cleanup-Funktion für Router
  return () => {
    removeSocketListener(onMessage);
  };
}
    
function getTodayOrders(){
  fetch("http://192.168.91.68:3000/api/getTodayOrders", {
    method: "GET",
    credentials: "include",
    })
    .then(response => response.json())
    .then(orderArray =>{
      document.getElementById("orderGrid").innerHTML="";
      console.log(orderArray);
      

      orderArray.forEach(o=>{
        createOrderBox(o);
      });
        
    });

  }
  function createOrderBox(order){
    let coldDrinksList;
    let hotDrinksList;
    let alcDrinksList;
    let orderBox;
    let newOrders=0;
    let IPOrders = 0;
    let boxLabel;
    const grid = document.getElementById("orderGrid");
    if (document.getElementById(order.orderId)) {
      orderBox = document.getElementById(order.orderId);
    }else{
      orderBox = document.createElement("div")
      orderBox.className = `orderBox ${order.state}`;
      orderBox.id = order.orderId;
      boxLabel = document.createElement("div");
      boxLabel.className="boxLabel";
      const label = document.createElement("h3");
      label.innerHTML = `${order.room}:<br> Tisch ${order.tblNr}`
      boxLabel.appendChild(label);
      orderBox.appendChild(boxLabel);

    }
    if (document.getElementById(`cold${order.orderId}`)){
        coldDrinksList = document.getElementById(`cold${order.orderId}`)
    }else{
      coldDrinksList = document.createElement("ul");
      coldDrinksList.className = "dishList";
      coldDrinksList.id = `cold${order.orderId}`;
      const row = document.createElement("h3");
      row.textContent="Kaltgetränke";
      row.className="orderLabel";
      coldDrinksList.appendChild(row);
    }
    if (document.getElementById(`hot${order.orderId}`)){
        hotDrinksList = document.getElementById(`hot${order.orderId}`)
    }else{
      hotDrinksList = document.createElement("ul");
      hotDrinksList.className = "dishList";
      hotDrinksList.id = `hot${order.orderId}`;
      const row = document.createElement("h3");
      row.textContent="Heißgetränke";
      row.className="orderLabel";
      hotDrinksList.appendChild(row);
    }
    if (document.getElementById(`alc${order.orderId}`)){
        alcDrinksList = document.getElementById(`alc${order.orderId}`)
    }else{
      alcDrinksList = document.createElement("ul");
      alcDrinksList.className = "dishList";
      alcDrinksList.id = `alc${order.orderId}`;
      const row = document.createElement("h3");
      row.textContent="alkoholische Getränke";
      row.className="orderLabel";
      alcDrinksList.appendChild(row);
    }
    const groups = {
          coldDrinks: [],
          hotDrinks: [],
          alcDrinks: [],
       };
        for (const guestId in order.guests) {
        const items = order.guests[guestId];
        items.forEach(item => {
      if(item.state !== "served" && item.state !== "payed"){
        if (groups[item.variety]) {
          groups[item.variety].push({ ...item, guestId });
          if (item.state === "new") newOrders++;
          if (item.state === "inProgress") IPOrders++;
        }
      }
    });     
    }
      groups.coldDrinks.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.hotDrinks.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.alcDrinks.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.coldDrinks.forEach(item => {
        createOrderItem(order.orderId, item.guestId, item, coldDrinksList);
      });
      groups.hotDrinks.forEach(item => {
        createOrderItem(order.orderId, item.guestId, item, hotDrinksList);
      });
      groups.alcDrinks.forEach(item => {
       createOrderItem(order.orderId, item.guestId, item, alcDrinksList);
      });
    const NOrders = document.createElement("h3");
      NOrders.className ="new";
      NOrders.id = `NOrders ${order.orderId}`
      NOrders.textContent=`Neue Bestellungen: ${newOrders}`;
      NOrders.style.display = "none";
      boxLabel.appendChild(NOrders);
      if(newOrders >0) NOrders.style.display = "block";
    
   
    const POrders = document.createElement("h3");
      POrders.className ="inProgress";
      POrders.id = `POrders ${order.orderId}`
      POrders.textContent=`Laufende Bestellungen: ${IPOrders}`;
      POrders.style.display = "none";
      boxLabel.appendChild(POrders);
      if(IPOrders >0) POrders.style.display = "block";

    orderBox.appendChild(coldDrinksList);
    orderBox.appendChild(hotDrinksList);
    orderBox.appendChild(alcDrinksList);
    grid.appendChild(orderBox);
    orderBox.addEventListener("click", () =>{
      if(!orderBox.classList.contains("active")){
        orderBox.classList.add("active");
      }
    });
    const button = document.createElement("button");
    button.textContent = "Schließen"; 
    button.className = "clsBtn";
    button.addEventListener("click", (event) => {
      event.stopPropagation(); // Verhindert, dass das Klick-Event auch die orderBox aktiviert
      orderBox.classList.remove("active");
      if(orderBox.classList.contains("new")){
        orderBox.classList.replace("new", "inProgress");
        fetch("http://192.168.91.68:3000/api/changeOrderState", {
          method: "POST",
          headers: {"Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(order)
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error =>{
        console.error("Fehler bim Ändern der Bestellung", error);
     
        })
      }
      getTodayOrders();
    });
    orderBox.appendChild(button);
    setChangeBtns()
   

  }
  function createOrderItem(orderId, guestId, item, list){
      const row = document.createElement("tr");
      row.className = "tblOrder";

      const tdName = document.createElement("td");
      tdName.className = `orderListItem ${item.state}`;
      tdName.textContent = item.name;

     const tdBtn = document.createElement("td");
    tdBtn.className = "btn";
    const btn1 = document.createElement("button");
    btn1.className = `changeBtn Back ${item.state}`;
    btn1.dataset.orderId = orderId;
    btn1.dataset.guestId = guestId;
    btn1.dataset.item = JSON.stringify(item);
    btn1.textContent = "Zurück";
    
    const text = document.createElement("label");
    text.textContent = item.state;
    text.classList = `orderState ${item.state}`
    
    const btn2 = document.createElement("button");
    btn2.className = `changeBtn For ${item.state}`;
    btn2.dataset.orderId = orderId;
    btn2.dataset.guestId = guestId;
    btn2.dataset.item = JSON.stringify(item);
    btn2.textContent = "Weiter";
  
    tdBtn.appendChild(btn1);
    tdBtn.appendChild(text);
    tdBtn.appendChild(btn2);

    row.appendChild(tdName);
    row.appendChild(tdBtn);
      list.appendChild(row);
  }
  function changeItemState(orderId, guestId, item){
    console.log(orderId, guestId, item);
    const order = {orderId, guestId, item};
    fetch("http://192.168.91.68:3000/api/changeItemState", {
        method:"POST",
        headers: {"Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(order)
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error =>{
        console.error("Fehler bim Ändern der Bestellung", error);
     
        });
      }
    function updateOrderBox(order) {
    const orderBox = document.getElementById(order.orderId);
    if (!orderBox) {
        // Falls die Bestellung neu ist
        createOrderBox(order);
        return;
  }

  // Aktualisiere nur den Inhalt (z. B. neue Items)
  const coldDrinksList = document.getElementById(`cold${order.orderId}`);
  const hotDrinksList = document.getElementById(`hot${order.orderId}`);
  const alcDrinksList = document.getElementById(`alc${order.orderId}`);

  // Bestehende Items löschen, außer die Headline (erste Zeile)
  while (coldDrinksList.children.length > 1) coldDrinksList.removeChild(coldDrinksList.lastChild);
  while (hotDrinksList.children.length > 1) hotDrinksList.removeChild(hotDrinksList.lastChild);
  while (alcDrinksList.children.length > 1) alcDrinksList.removeChild(alcDrinksList.lastChild);

  const groups = {
    coldDrinks: [],
    hotDrinks: [],
    alcDrinks: [],
  };
  let newOrders = 0;
  let IPOrders = 0;


  for (const guestId in order.guests) {
    const items = order.guests[guestId];
    items.forEach(item => {
      if(item.state !== "served" && item.state !== "payed"){
        if (groups[item.variety]) {
          groups[item.variety].push({ ...item, guestId });
          if (item.state === "new") newOrders++;
          if (item.state === "inProgress") IPOrders++;
        }
      }
    });      
  }
  groups.coldDrinks.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.hotDrinks.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.alcDrinks.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

  groups.coldDrinks.forEach(item => createOrderItem(order.orderId, item.guestId, item, coldDrinksList));
  groups.hotDrinks.forEach(item => createOrderItem(order.orderId, item.guestId, item, hotDrinksList));
  groups.alcDrinks.forEach(item => createOrderItem(order.orderId, item.guestId, item, alcDrinksList));

  // Neue Bestellungsanzeige aktualisieren
  const NOrders = document.getElementById(`NOrders ${order.orderId}`);
 if(NOrders && newOrders>0){
  NOrders.textContent = `Neue Bestellungen: ${newOrders}`;
  NOrders.style.display ="block";
 }else{NOrders.style.display ="none";}


 const POrders = document.getElementById(`POrders ${order.orderId}`);
 if(POrders && IPOrders>0){
  POrders.textContent=`Laufende Bestellungen: ${IPOrders}`;
  POrders.style.display ="block";
 }else{POrders.style.display ="none";}
  
  setChangeBtns()
}
function setChangeBtns(){
   document.querySelectorAll(".changeBtn.For").forEach(btn => {
    btn.removeEventListener("click", btn._listener); // Falls schon gesetzt

    const listener = () => {
      const orderId = btn.dataset.orderId;
      const guestId = btn.dataset.guestId;
      const item = JSON.parse(btn.dataset.item);
      changeItemState(orderId, guestId, item);

     
    };

    btn.addEventListener("click", listener);
    btn._listener = listener; // Referenz speichern, damit man es später entfernen kann
  });
  document.querySelectorAll(".changeBtn.Back").forEach(btn => {
    btn.removeEventListener("click", btn._listener); // Falls schon gesetzt

    const listener = () => {
      const orderId = btn.dataset.orderId;
      const guestId = btn.dataset.guestId;
      const item = JSON.parse(btn.dataset.item);
      changeItemStateBack(orderId, guestId, item);

      
    };

    btn.addEventListener("click", listener);
    btn._listener = listener; // Referenz speichern, damit man es später entfernen kann
  });
}
function changeItemStateBack(orderId, guestId, item){
    console.log(orderId, guestId, item);
    const order = {orderId, guestId, item};
    fetch("http://192.168.91.68:3000/api/changeItemStateBack", {
        method:"POST",
        headers: {"Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(order)
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error =>{
        console.error("Fehler bim Ändern der Bestellung", error);
     
        });
      }