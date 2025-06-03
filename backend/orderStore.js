const { nanoid } = require('nanoid');

class orderStore{
    constructor(){
        this.orders = new Map();
    }
    

    createOrder(data, callback){
        const {orderId, room, tblNr} = data;
        if(this.orders.has(orderId)){
            return callback(null, { message: "Bestellung existiert bereits" });
        }

        this.orders.set(orderId, {
            orderId,
            room,
            tblNr,
            state: "new",
            guests: {},
            createdAt: Date.now()
        });
        callback(null, {message: "Bestellung erfolgreich angelegt"});

    }
    addItem(orderData, callback){
        const {orderId, guestId, item} = orderData

        const order = this.orders.get(orderId);
        if(!order) callback(new Error("Bestellung nicht gefunden"));

        if(!order.guests[guestId]) {
            order.guests[guestId] = [];
        }
        order.guests[guestId].push({
            name: item.name,
            price: item.price,
            state: "new"
        });
        callback(null, {message: "Artikel erfolgreich hinzugefügt"})
    }
    addMultipleItems(orderData, callback) {
        const {orderId, guestsObj} = orderData;
        console.log(orderId);
        const order = this.orders.get(orderId);
        if(!order) callback(new Error("Bestellung nicht gefunden"));

        for(const [guestId, items] of Object.entries(guestsObj)){
            if(!Array.isArray(items)) continue;
        
            if(!order.guests[guestId]){
                order.guests[guestId] = [];
            }

        items.forEach(item =>{
            if(item.name && item.price){
            
                order.guests[guestId].push({
                    id: nanoid(),
                    name: item.name,
                    price: item.price,
                    time: new Date().toISOString(),
                    variety: item.variety,
                    state: "new"
                });
            }
        })
        }
        callback(null, order);

    }
    removeItem(orderData, callback) {
        const {orderId, guestId, item} = orderData;
        const order = this.orders.get(orderId);
        if (!order) return callback(new Error("Bestellung nicht gefunden"));
    
        const guestItems = order.guests[guestId];
        if (!guestItems) return callback(new Error("Gast nicht gefunden"));
    
        // Finde den Index des Items und entferne es
        const itemIndex = guestItems.findIndex(
            (guestItem) => guestItem.id === item.id
        );
        if (itemIndex === -1) return callback(new Error("Item nicht gefunden"));
    
        guestItems.splice(itemIndex, 1); // Entfernt das Item aus dem Array
        return callback(null, order);
    }
    
    getOrder(orderData, callback){
        const {orderId, guestId} = orderData;
        console.log("orderId:", orderId, "guestId:", guestId);
        const order = this.orders.get(orderId);
        if(!order){
            callback(new Error("Bestellung nicht gefunden"));
        }
        const guestItems = order.guests[guestId];
        if(!guestItems){
            return callback(null, ({message: "Gast nicht gefunden"}));
        }
        callback(null, guestItems);
    }

    deleteOrder(orderData, callback){
        const orderId = orderData.orderId;
        if(!this.orders.has(orderId)){
            callback(new Error("Bestellung nicht gefunden"));
        }
        this.orders.delete(orderId);
        callback(null, "Bestellung: ", orderId, " entfernt");

    }

    importOrder(orderJson){
        const order = JSON.parse(orderJson);
        this.orders.set(order.orderId, order);
    }
    getTodayOrders(callback){
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today.getTime();
        const endOfDay = startOfDay + 24*60*60*1000;

        const todayOrders = Array.from(this.orders.values()).filter(order =>
            order.createdAt >= startOfDay && order.createdAt < endOfDay
        );
        callback(null, todayOrders);
    }
    getAllOrders(callback){
        const orders = Array.from(this.orders.values());

        callback(null, orders)
    }
    changeItemState(orderData, callback){
        const item = orderData.item;
        const orderId = parseInt(orderData.orderId, 10);
        const guestId = parseInt(orderData.guestId, 10);
        const order = this.orders.get(orderId);
        console.log(orderId);
        if(!order){
            return callback(new Error("Bestellung nicht gefunden"));
            
        }
        const guestItems = order.guests[guestId];
        if (!guestItems) return callback(new Error("Gast nicht gefunden"));
    
        
        const itemIndex = guestItems.findIndex(
            (guestItem) => guestItem.id === item.id
        );
        if (itemIndex === -1) return callback(new Error("Item nicht gefunden"));
        if(guestItems[itemIndex].state ==="new"){
            guestItems[itemIndex].state = "inProgress";
        }else if(guestItems[itemIndex].state ==="inProgress"){
            guestItems[itemIndex].state = "done";
        }else if(guestItems[itemIndex].state ==="done"){
            guestItems[itemIndex].state = "served";
        }

        

        guestItems[itemIndex].updatedAt = new Date().toISOString();

        callback(null, order); // Erfolg zurückmelden
    }
    changeItemStateBack(orderData, callback){
        const item = orderData.item;
        const orderId = parseInt(orderData.orderId, 10);
        const guestId = parseInt(orderData.guestId, 10);
        const order = this.orders.get(orderId);
        console.log(orderId);
        if(!order){
            return callback(new Error("Bestellung nicht gefunden"));
            
        }
        const guestItems = order.guests[guestId];
        if (!guestItems) return callback(new Error("Gast nicht gefunden"));
    
        
        const itemIndex = guestItems.findIndex(
            (guestItem) => guestItem.id === item.id
        );
        if (itemIndex === -1) return callback(new Error("Item nicht gefunden"));
        if(guestItems[itemIndex].state ==="done"){
            guestItems[itemIndex].state = "inProgress";
        }else if(guestItems[itemIndex].state ==="inProgress"){
            guestItems[itemIndex].state = "new";
        }
        

        guestItems[itemIndex].updatedAt = new Date().toISOString();

        callback(null, order); // Erfolg zurückmelden
    }
    changeOrderState(orderData, callback){
        const orderId = orderData.orderId;
        const order = this.orders.get(orderId);
        order.state = "inProgress";

        callback(null, order);

    }
}

module.exports = orderStore;