import { roleCheck } from "./script.js";

export function initLoginPage(){
    
    roleCheck();
    document.getElementById("login-form").addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const errorMessage = document.getElementById("login-error-message");
    
    const response = await fetch("http://192.168.91.68:3000/api/login", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json" 
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.error) {
        errorMessage.textContent = data.error;
    } else {
        
        roleCheck()
       
        
        
    }
    });
}

