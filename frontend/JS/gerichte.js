import { roleCheck } from "./script.js";


export function initGerichtePage() {
    roleCheck();
    fetch("http://localhost:3000/api/speisekarte")
        .then(response => response.json())
        .then(data => {
            // Container vorbereiten
            const appetizerList = document.getElementById("app-items");
            const mainCourseList = document.getElementById("main-items");
            const dessertList = document.getElementById("dess-items");
            
            // Inhalte leeren
            appetizerList.innerHTML = "";
            mainCourseList.innerHTML = "";
            dessertList.innerHTML = "";
            
            // Gruppiere Speisen nach Kategorie
            const groups = {
                appetizer: [],
                mainCourse: [],
                dessert: []
            };
            
            data.forEach(speise => {
                if (groups[speise.variety]) {
                    groups[speise.variety].push(speise);
                } else {
                    console.warn("Unbekannte Kategorie:", speise.variety);
                }
            });
            
            // Funktion zum Rendern und Markieren
            function renderGroup(speisen, container) {
                speisen.forEach((speise, index) => {
                    const div = document.createElement("div");
                    div.classList.add("speise");
            
                    const isFirst = index === 0;
                    const isLast = index === speisen.length - 1;
            
                    div.innerHTML = `
                        <div class="dishCont ${isFirst ? "first" : ""} ${isLast ? "last" : ""}">  
                            <div class="dish">
                                <strong class="gericht">${speise.name}</strong>
                                <p class="dishDesc">${speise.description}</p>
                                <em class="dishPrice">${speise.price} €</em>
                            </div>
                            <img src="${speise.image}" class="menuPic dish" alt="${speise.name}">
                        </div>
                    `;
            
                    container.appendChild(div);
                });
            }
        
            
            // Gruppen rendern
            renderGroup(groups.appetizer, appetizerList);
            renderGroup(groups.mainCourse, mainCourseList);
            renderGroup(groups.dessert, dessertList);
        })
        .catch(error => console.error("Fehler beim Abrufen der Speisekarte:", error));
}
