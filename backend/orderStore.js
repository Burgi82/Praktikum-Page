

class orderStore{
    constructor(){
        this.orders = new Map();
    }
    

    createOrder(data, callback){
        const orderId = data.orderId;
        if(this.orders.has(orderId)){
            return callback(null, { message: "Bestellung existiert bereits" });
        }

        this.orders.set(orderId, {
            orderId,
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
                    name: item.name,
                    price: item.price,
                    time: new Date().toISOString(),
                    variety: item.variety,
                    state: "new"
                });
            }
        })
        }
        callback(null, {message: "Artikel wurden hinzugefügt"});

    }
    removeItem(orderData, callback) {
        const {orderId, guestId, item} = orderData;
        const order = this.orders.get(orderId);
        if (!order) return callback(new Error("Bestellung nicht gefunden"));
    
        const guestItems = order.guests[guestId];
        if (!guestItems) return callback(new Error("Gast nicht gefunden"));
    
        // Finde den Index des Items und entferne es
        const itemIndex = guestItems.findIndex(
            (guestItem) => guestItem.name === item.name && guestItem.price === item.price
        );
        if (itemIndex === -1) return callback(new Error("Item nicht gefunden"));
    
        guestItems.splice(itemIndex, 1); // Entfernt das Item aus dem Array
        return callback(null, {message: "Artikel wurde entfernt: ", orderId, item});
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
    changeOrderState(orderData, callback){
        const {orderId, guestId, item} = orderData;
        const order = this.orders.get(orderId);
        const guestItems = order.guests[guestId];
        if (!guestItems) return callback(new Error("Gast nicht gefunden"));
    
        // Finde den Index des Items und entferne es
        const itemIndex = guestItems.findIndex(
            (guestItem) => guestItem.name === item.name && guestItem.price === item.price
        );
        if (itemIndex === -1) return callback(new Error("Item nicht gefunden"));

        guestItems[itemIndex].state = item.state || "inProgress";

        guestItems[itemIndex].updatedAt = new Date().toISOString();

        callback(null, guestItems[itemIndex]); // Erfolg zurückmelden
    }
}

module.exports = orderStore;