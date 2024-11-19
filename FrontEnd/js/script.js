import { apiUrl, apiGet } from './config.js';

// fonction chargement data api
async function loadApi(api){
    const dataResponse = await fetch(api);
    const data = await dataResponse.json();
    return data
}

// Fonction pour charger works, categories et de futurs elements en parallèle
async function loadData() {
    const promises = apiGet.map(get => loadApi(`${apiUrl}${get}`));
    const results = await Promise.all(promises);
    const data = apiGet.reduce((acc, get, value) => {
        acc[get] = results[value];
        return acc;
    }, {});

    return data;
}

// Fonction pour ajouter les boutons categories
function createBtns(categories){
    const btnsContainer = document.querySelector('.btns-container');
    const btnFilterAll = document.createElement('button');
    btnFilterAll.setAttribute('aria-selected', 'true');
    btnFilterAll.className = 'btn-filter';
    btnFilterAll.dataset.category = 'all';
    btnFilterAll.textContent = 'Tous';
    btnsContainer.appendChild(btnFilterAll);
    categories.forEach(category => {
        const btnFilter = document.createElement('button');
        btnFilter.setAttribute('aria-selected', 'false');
        btnFilter.className = 'btn-filter';
        btnFilter.dataset.category = category.id;
        btnFilter.textContent = category.name;
        btnsContainer.appendChild(btnFilter);
    })
}

// Fonction pour ajouter les works 
function createWorks(works) {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = "";
    works.forEach(work => {
        const figure = document.createElement('figure');
        figure.classList.add('figureFilter', `category-${work.categoryId}`);
        const img = document.createElement('img');
        img.src = work.imageUrl;
        img.alt = work.title;
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = work.title;
        figure.appendChild(img);
        figure.appendChild(figcaption);
        gallery.appendChild(figure);
    }); 
}

// Fonction pour filtrer les works
function filtreWorks(figureData, button) {
    figureData.forEach(figure => {
        figure.style.transition = 'opacity 0.5s';
        if (figure.classList.contains(`category-${button.dataset.category}`) || (button.dataset.category === "all")){           
            figure.style.opacity = '0';
            setTimeout(() => {
                figure.style.display = "block";
                setTimeout(() => {
                    figure.style.opacity = '1';
                }, 200);
            }, 100);            
        } 
        else {
            figure.style.opacity = '0';
            setTimeout(() => {
                figure.style.display = "none";
            }, 100);          
        }
    }) 
}  

// Fonction pour activation du bouton et filtre selon bouton
function filtreBtns() {
    const buttons = document.querySelectorAll('.btn-filter');
    const figureData = document.querySelectorAll('.figureFilter');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.setAttribute('aria-selected', 'false')); // modifier aria-active "false" sur tous les boutons                      
            button.setAttribute('aria-selected', 'true'); // modifier aria-active "true" sur le bouton actif
            filtreWorks(figureData, button);
        })
    })
}

// Lancer la fonction au démarrage de la page
export async function init() {
    const dataLoaded = await loadData();
    const works = dataLoaded.works;
    const categories = dataLoaded.categories;
    createBtns(categories);
    createWorks(works);
    filtreBtns();   
    console.log("Works:", works);
    console.log("Categories:", categories);
}
