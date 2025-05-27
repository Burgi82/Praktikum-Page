
import { tokenCheck } from './script.js';  
import { showConfirmationPopup } from './script.js';


const socket = new WebSocket("ws://http://192.168.91.68:3000");

export function initChefPage(){
    tokenCheck();
  getTodayOrders();

    
}


socket.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  if (data.type === "new-order") {
    console.log("Neue Bestellung:", data.data);
    // hier z. B. ins Grid einfügen
  }
};

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
    let appetizerList;
    let mainCourseList;
    let dessertList;
    let orderBox;
    let newOrders=0;
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
          if (groups[item.variety]) {
           groups[item.variety].push({ ...item, guestId });
           if(item.state === "new"){
            newOrders++;
           }

        }
      });      
    }
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
    });
    orderBox.appendChild(button);
    document.querySelectorAll(".changeBtn").forEach(btn =>{
      const orderId = btn.dataset.orderId;
      const guestId = btn.dataset.guestId;
      const item = JSON.parse(btn.dataset.item);
     btn.addEventListener("click", () => changeItemState(orderId, guestId, item));

    })

  }
  function createOrderItem(orderId, guestId, item, list){
      const row = document.createElement("tr");

      const tdName = document.createElement("td");
    tdName.className = "orderListItem";
    tdName.textContent = item.name;

    const tdBtn = document.createElement("td");
    tdBtn.className = "btn";
    const btn = document.createElement("button");
    btn.className = `changeBtn ${item.state}`;
    btn.dataset.orderId = orderId;
    btn.dataset.guestId = guestId;
    btn.dataset.item = JSON.stringify(item);
    btn.textContent = item.state;
    tdBtn.appendChild(btn);

    row.appendChild(tdName);
    row.appendChild(tdBtn);
      list.appendChild(row);
  }
  function changeItemState(orderId, guestId, item){
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
     
        })
      }
