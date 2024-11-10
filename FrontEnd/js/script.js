import { worksApi, categoriesApi } from './config.js';

// fonction chargement data api
async function loadApi(api){
    const dataResponse = await fetch(api);
    const data = await dataResponse.json();
    return data
}

// Fonction pour charger works et categories en parallèle
async function loadData() {
    const [works, categories] = await Promise.all([loadApi(worksApi), loadApi(categoriesApi)]);
    return { works, categories };
}

// Fonction pour ajouter les boutons categories
function createBtns(categories){
    const btnsContainer = document.querySelector('.btns-container');
    const btnFiltreAll = document.createElement('button');
    btnFiltreAll.setAttribute('aria-selected', 'true');
    btnFiltreAll.className = 'btn-filter';
    btnFiltreAll.dataset.category = 'all';
    btnFiltreAll.textContent = 'Tous';
    btnsContainer.appendChild(btnFiltreAll);
    categories.forEach(category => {
        const btnFiltre = document.createElement('button');
        btnFiltre.setAttribute('aria-selected', 'false');
        btnFiltre.className = 'btn-filter';
        btnFiltre.dataset.category = category.id;
        btnFiltre.textContent = category.name;
        btnsContainer.appendChild(btnFiltre);
    })
}

// Fonction pour ajouter les works 
function createWorks(works) {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = "";
    works.forEach(work => {
        const figure = document.createElement('figure');
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
function filtreWorks(works, button) {
    if (button.dataset.category !== "all"){
        const categoryidparser = Number(button.dataset.category);
        const idWorkFilter = works.filter(work => work.categoryId === categoryidparser); // filtrer selon l'id de categories
        createWorks(idWorkFilter);
    } 
    else {
        createWorks(works); 
    }    

}

// Fonction pour activation du bouton et filtre selon bouton
function filtreBtns(works) {
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.setAttribute('aria-selected', 'false')); // modifier aria-active "false" sur tous les boutons                      
            button.setAttribute('aria-selected', 'true'); // modifier aria-active "true" sur le bouton actif
            filtreWorks(works, button);
        })
    })
}

// Lancer la fonction au démarrage de la page
async function init() {
    const dataLoaded = await loadData();
    const works = dataLoaded.works;
    const categories = dataLoaded.categories;
    createBtns(categories);
    createWorks(works);
    filtreBtns(works);   
    console.log("Works:", works);
    console.log("Categories:", categories);
}

init();