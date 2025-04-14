

export async function renderRoute(path) {
    const content = document.getElementById("content");


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

// Startseite beim ersten Laden
window.addEventListener("DOMContentLoaded", () => {
const path = "home";
    renderRoute(path);
});


