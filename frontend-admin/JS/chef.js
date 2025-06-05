
import { tokenCheck } from './script.js';  
import { showConfirmationPopup } from './script.js';
import { addSocketListener, removeSocketListener } from "./socketManager.js";



export function initChefPage() {
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
        console.log(o);
        createOrderBox(o);
      });
        
    });

  }
  function createOrderBox(order){
    let appetizerList;
    let mainCourseList;
    let dessertList;
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
    if (document.getElementById(`apps${order.orderId}`)){
        appetizerList = document.getElementById(`apps${order.orderId}`)
    }else{
      appetizerList = document.createElement("ul");
      appetizerList.className = "dishList";
      appetizerList.id = `apps${order.orderId}`;
      const row = document.createElement("h3");
      row.textContent="Vorspeisen";
      row.className="orderLabel";
      appetizerList.appendChild(row);
    }
    if (document.getElementById(`main${order.orderId}`)){
        mainCourseList = document.getElementById(`main${order.orderId}`)
    }else{
      mainCourseList = document.createElement("ul");
      mainCourseList.className = "dishList";
      mainCourseList.id = `main${order.orderId}`;
      const row = document.createElement("h3");
      row.textContent="Hauptgang";
      row.className="orderLabel";
      mainCourseList.appendChild(row);
    }
    if (document.getElementById(`dess${order.orderId}`)){
        dessertList = document.getElementById(`dess${order.orderId}`)
    }else{
      dessertList = document.createElement("ul");
      dessertList.className = "dishList";
      dessertList.id = `dess${order.orderId}`;
      const row = document.createElement("h3");
      row.textContent="Dessert";
      row.className="orderLabel";
      dessertList.appendChild(row);
    }
    const groups = {
          appetizer: [],
          mainCourse: [],
          dessert: [],
       };
        for (const guestId in order.guests) {
        const items = order.guests[guestId];
       items.forEach(item => {
      if(item.state !== "served"){
        if (groups[item.variety]) {
          groups[item.variety].push({ ...item, guestId });
          if (item.state === "new") newOrders++;
          if (item.state === "inProgress") IPOrders++;
        }
      }
    });     
    }
      groups.appetizer.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.mainCourse.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.dessert.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.appetizer.forEach(item => {
        createOrderItem(order.orderId, item.guestId, item, appetizerList);
      });
      groups.mainCourse.forEach(item => {
        createOrderItem(order.orderId, item.guestId, item, mainCourseList);
      });
      groups.dessert.forEach(item => {
       createOrderItem(order.orderId, item.guestId, item, dessertList);
      });
    if(newOrders>0){
      const Orders = document.createElement("h3");
      Orders.className ="new";
      Orders.textContent=`Neue Bestellungen: ${newOrders}`;
      boxLabel.appendChild(Orders);
    }
    if(IPOrders>0){
      const Orders = document.createElement("h3");
      Orders.className ="inProgress";
      Orders.textContent=`Laufende Bestellungen: ${IPOrders}`;
      boxLabel.appendChild(Orders);
    }
    orderBox.appendChild(appetizerList);
    orderBox.appendChild(mainCourseList);
    orderBox.appendChild(dessertList);
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
    tdBtn.appendChild(btn1);
    const text = document.createElement("label")
    text.textContent = item.state;
    text.classList = `orderState ${item.state}`
    tdBtn.appendChild(text);
    const btn2 = document.createElement("button");
    btn2.className = `changeBtn For ${item.state}`;
    btn2.dataset.orderId = orderId;
    btn2.dataset.guestId = guestId;
    btn2.dataset.item = JSON.stringify(item);
    btn2.textContent = "Weiter";
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
  function updateOrderBox(order) {
  const orderBox = document.getElementById(order.orderId);
  if (!orderBox) {
    // Falls die Bestellung neu ist
    createOrderBox(order);
    return;
  }

  // Aktualisiere nur den Inhalt (z. B. neue Items)
  const appetizerList = document.getElementById(`apps${order.orderId}`);
  const mainCourseList = document.getElementById(`main${order.orderId}`);
  const dessertList = document.getElementById(`dess${order.orderId}`);

  // Bestehende Items löschen, außer die Headline (erste Zeile)
  while (appetizerList.children.length > 1) appetizerList.removeChild(appetizerList.lastChild);
  while (mainCourseList.children.length > 1) mainCourseList.removeChild(mainCourseList.lastChild);
  while (dessertList.children.length > 1) dessertList.removeChild(dessertList.lastChild);

  const groups = {
    appetizer: [],
    mainCourse: [],
    dessert: [],
  };
  let newOrders = 0;
  let IPOrders = 0;

  for (const guestId in order.guests) {
    const items = order.guests[guestId];
    items.forEach(item => {
      if(item.state !== "served"){
        if (groups[item.variety]) {
          groups[item.variety].push({ ...item, guestId });
          if (item.state === "new") newOrders++;
          if (item.state === "inProgress") IPOrders++;
        }
      }
    });  
  }
  groups.appetizer.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.mainCourse.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      groups.dessert.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

  groups.appetizer.forEach(item => createOrderItem(order.orderId, item.guestId, item, appetizerList));
  groups.mainCourse.forEach(item => createOrderItem(order.orderId, item.guestId, item, mainCourseList));
  groups.dessert.forEach(item => createOrderItem(order.orderId, item.guestId, item, dessertList));

  // Neue Bestellungsanzeige aktualisieren
  const existingNewLabel = orderBox.querySelector(".new");
  if (existingNewLabel) existingNewLabel.remove();
  
    const nOrders = document.createElement("h3");
    nOrders.className = "new";
    nOrders.textContent = `Neue Bestellungen: ${newOrders}`;
    orderBox.querySelector(".boxLabel").appendChild(nOrders);
  
  const existingIPLabel = orderBox.querySelector(".inProgress");
  if (existingIPLabel) existingIPLabel.remove();
  
    const ipOrders = document.createElement("h3");
    ipOrders.className = "inProgress";
    ipOrders.textContent = `laufende Bestellungen: ${IPOrders}`;
    orderBox.querySelector(".boxLabel").appendChild(ipOrders);
  
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
