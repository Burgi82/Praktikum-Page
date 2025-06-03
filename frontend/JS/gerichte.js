


export function initGerichtePage() {
   
    fetch("http://192.168.91.68:3000/api/speisekarte")
        .then(response => response.json())
        .then(data => {
            // Container vorbereiten
            const appetizerList = document.getElementById("app-items");
            const mainCourseList = document.getElementById("main-items");
            const dessertList = document.getElementById("dess-items");
            const coldDrinksList = document.getElementById("cold-items");
            const hotDrinksList = document.getElementById("hot-items");
            const alcDrinksList = document.getElementById("alc-items");
            // Inhalte leeren
            appetizerList.innerHTML = "";
            mainCourseList.innerHTML = "";
            dessertList.innerHTML = "";
            coldDrinksList.innerHTML="";
            hotDrinksList.innerHTML="";
            alcDrinksList.innerHTML="";
            // Gruppiere Speisen nach Kategorie
            const groups = {
                appetizer: [],
                mainCourse: [],
                dessert: [],
                coldDrinks: [],
                hotDrinks: [],
                alcDrinks: []
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
                    console.log(speise.allergens);
                    const isFirst = index === 0;
                    const isLast = index === speisen.length - 1;
            
                    div.innerHTML = `
                        <div class="dishCont ${isFirst ? "first" : ""} ${isLast ? "last" : ""}">  
                            <div class="dish dishText">
                                <strong class="gericht">${speise.name}</strong>
                                <div class="dishDescBox">
                                <p class="dishDesc">${speise.description}</p>
                                <button class="dishInfoBtn" id="DishInfoBtn" data-allergens=${speise.allergens}>Info</button>
                                </div>
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
            renderGroup(groups.coldDrinks, coldDrinksList);
            renderGroup(groups.hotDrinks, hotDrinksList);
            renderGroup(groups.alcDrinks, alcDrinksList);
            document.querySelectorAll(".dishInfoBtn").forEach(btn =>{
                btn.addEventListener("click", () =>{
                    infoModal(btn.dataset.allergens);
                })
            })
            document.getElementById("closeInfoBtn").addEventListener("click", () =>{
                    document.getElementById("infoModal").style.display = "none";
                })
            
        })
        .catch(error => console.error("Fehler beim Abrufen der Speisekarte:", error));
}
function infoModal(allergens){
    console.log(allergens);
    const modal = document.getElementById("dishInfoList");
    modal.innerHTML="";
    const allergensArray = allergens.split(",");
    const ul = document.createElement("ul");
    allergensArray.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
});
    modal.appendChild(ul);
    document.getElementById("infoModal").style.display = "block";

}