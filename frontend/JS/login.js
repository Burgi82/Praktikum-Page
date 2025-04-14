
export function initLoginPage(){
    document.getElementById("registration-form").addEventListener("submit", function(event) {
        event.preventDefault();
    
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const errorMessage = document.getElementById("error-message");
    
        if (password !== confirmPassword) {
            errorMessage.textContent = "Die Passwörter stimmen nicht überein!";
            return;
        }
        const formData = new FormData(event.target);
        formData.delete("confirm-password");
        const jsonData = Object.fromEntries(formData.entries());
        fetch("http://localhost:3000/api/kunden", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Kunde gespeichert!");
            event.target.reset()
        })
        .catch(error => console.error("Fehler!",error));
    });
    document.getElementById("login-form").addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const errorMessage = document.getElementById("login-error-message");
    
    const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.error) {
        errorMessage.textContent = data.error;
    } else {
        alert("Login erfolgreich!");
        console.log(data.token); // Token ausgeben
        localStorage.setItem("token", data.token);
        window.location.href = "/userInfo"; // Speichern für spätere Authentifizierung
       // window.location.href = "admin.html"; // Weiterleitung
       
    }
    });
}

