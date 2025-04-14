export function initGerichtePage() {
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

            // Jede Speise einsortieren
            data.forEach(speise => {
                const div = document.createElement("div");
                div.classList.add("speise");

                div.innerHTML = `
                    <div class="dishCont">  
                        <div class="dish">
                            <strong class="gericht">${speise.name}</strong><br>
                            ${speise.description}<br>
                            <em>${speise.price} €</em>
                        </div>
                        <img src="${speise.image}" class="menuPic dish" alt="${speise.name}">
                    </div>
                `;

                // Je nach Kategorie anhängen
                switch (speise.variety) {
                    case "appetizer":
                        appetizerList.appendChild(div);
                        break;
                    case "mainCourse":
                        mainCourseList.appendChild(div);
                        break;
                    case "dessert":
                        dessertList.appendChild(div);
                        break;
                    default:
                        console.warn("Unbekannte Kategorie:", speise.variety);
                }
            });
        })
        .catch(error => console.error("Fehler beim Abrufen der Speisekarte:", error));
}
