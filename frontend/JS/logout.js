import { roleCheck } from "./script.js";

export function initLogoutPage(){
    window.token = null;
    localStorage.removeItem("token");
    roleCheck();
    
}

