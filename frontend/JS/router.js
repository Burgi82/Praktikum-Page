

export async function renderRoute(path) {
    const content = document.getElementById("content");

    try{
        const accessResponse = await fetch(`/api/checkAccess?path=${path}`, {
            credentials: "include"
        });

        if(!accessResponse.ok){
            const errData= await accessResponse.json();
            content.innerHTML = `<h2>Zugriff verweigert</h2><p>${errData.error}</p>`;
            setupMenuToggle();
            return;
        }
    }catch (e) {
            console.error("Fehler beim Zugriffscheck", e);
            content.innerHTML = `<h2>Fehler beim Rollencheck</h2>`;
            return;
        }

    try {
        const response = await fetch(`/Sites/${path}.html`);
        if(!response.ok) throw new Error("Seite nicht gefunden");
        const html = await response.text();
        content.innerHTML = html;
        history.pushState({}, "", `/${path}`);

        try{
            const module = await import(`./${path}.js?cache=${Date.now()}`);
            if(module && typeof module[`init${capitalize(path)}Page`]==="function"){
                module[`init${capitalize(path)}Page`]();
            }

        }catch (importErr) {
        console.warn(`Kein Modul für '${path}' gefunden.`);
        console.error(importErr);
        }
        setupMenuToggle();


        // Stelle sicher, dass der Event-Listener aktiv bleibt
        window.addEventListener('resize', () => {
        setupMenuToggle(); 
        });

        // Initiale Überprüfung beim Laden der Seite
        document.addEventListener('DOMContentLoaded', () => {
        setupMenuToggle();
        });
    }catch (err) {
    content.innerHTML = "<h2>404-Seite nicht gefunden</h2>";
     console.error(err);
    }
}

function capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
}

    

document.querySelectorAll("a.menu").forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();
        const path = this.getAttribute("href").replace("/", "");
        renderRoute(path);
    });
});

// Seite beim Laden auf richtige Route setzen
window.addEventListener("DOMContentLoaded", () => {
    let path = window.location.pathname.replace("/", "") || "home";
    renderRoute(path);
});

// Zurück- und Vorwärts-Navigation unterstützen
window.addEventListener("popstate", () => {
    let path = window.location.pathname.replace("/", "") || "home";
    renderRoute(path);
});
function setupMenuToggle(){
    const menuButton = document.getElementById("menu-toggle");
    const sideMenu = document.getElementById("side-menu");

    
    if(menuButton){
        menuButton.removeEventListener("click", toggleMenu);
        menuButton.addEventListener("click", toggleMenu);
    }
    // Optional: Schließe das Menü, wenn der Benutzer außerhalb klickt
    document.addEventListener("click", (event) => {
        if (!sideMenu.contains(event.target) && event.target !== menuButton) {
            sideMenu.style.left = "-250px";
        }
    });
}
function toggleMenu() {
    const sideMenu = document.getElementById("side-menu");
    if (sideMenu.style.left === "0px") {
        sideMenu.style.left = "-250px"; // Menü ausblenden
    } else {
        sideMenu.style.left = "0px"; // Menü einblenden
    }
}
