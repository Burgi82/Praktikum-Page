
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
    const grid = document.getElementById("orderGrid");
    const orderBox = document.createElement("div")
    orderBox.className = `orderBox ${order.state}`;
    
    

    const appetizerList = document.createElement("ul");
    appetizerList.className = "dishList";
    const mainCourseList = document.createElement("ul");
    mainCourseList.className = "dishList";
    const dessertList = document.createElement("ul");
    dessertList.className = "dishList";
    const groups = {
          appetizer: [],
          mainCourse: [],
          dessert: [],
    };
    order.forEach(guests =>{
      if (groups[guests.item.variety])
        groups[guests.item.variety].push(item)
    })
    
  }
