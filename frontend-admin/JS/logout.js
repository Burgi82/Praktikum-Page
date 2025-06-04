

export function initLogoutPage(){
   
   fetch("http://192.168.91.68:3000/api/logout", {
    method: "POST",
    credentials: "include" // wichtig, damit das Cookie mitgeschickt wird
})
.then(res => res.json())
.then(data => {
    console.log(data.message);
    
})
.catch(err => console.error("Logout-Fehler:", err));

    
}

