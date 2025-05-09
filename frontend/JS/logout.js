import { isLoggedIn } from "./script.js";

export function initLogoutPage(){
    window.token = null;
    localStorage.removeItem("token");
    isLoggedIn();
    
}

