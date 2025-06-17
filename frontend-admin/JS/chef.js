
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
      if(item.state !== "served"&& item.state !== "payed"){
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
  async function createOrderItem(orderId, guestId, item, list){
    
    
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

    return row;
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

 async function updateOrderBox(order) {
  let orderBox = document.getElementById(order.orderId);

  if (!orderBox) {
    // Bestellung neu → Element erstellen
    createOrderBox(order);
    // Warten, bis DOM bereit
    orderBox = await waitForElement(order.orderId);
  }

  const appetizerList = await waitForElement(`apps${order.orderId}`);
  const mainCourseList = await waitForElement(`main${order.orderId}`);
  const dessertList = await waitForElement(`dess${order.orderId}`);

  // Kinder löschen (außer erste Zeile)
  while (appetizerList.children.length > 1)
    appetizerList.removeChild(appetizerList.lastChild);
  while (mainCourseList.children.length > 1)
    mainCourseList.removeChild(mainCourseList.lastChild);
  while (dessertList.children.length > 1)
    dessertList.removeChild(dessertList.lastChild);

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
      if (item.state !== "served" && item.state !=="payed" && groups[item.variety]) {
        groups[item.variety].push({ ...item, guestId });
        if (item.state === "new") newOrders++;
        if (item.state === "inProgress") IPOrders++;
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

 for (const item of groups.appetizer) {
  await createOrderItem(order.orderId, item.guestId, item, appetizerList);
}
for (const item of groups.mainCourse) {
  await createOrderItem(order.orderId, item.guestId, item, mainCourseList);
}
for (const item of groups.dessert) {
  await createOrderItem(order.orderId, item.guestId, item, dessertList);
}

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
function waitForElement(id, interval = 50) {
  return new Promise(resolve => {
    const check = () => {
      const el = document.getElementById(id);
      if (el) return resolve(el);
      setTimeout(check, interval);
    };
    check();
  });
}
