import { apiUrl, apiGet } from './config.js';

// Fonction erreur affichage api
function errorApi() {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = "";
    const errorMessage = document.createElement('p');
    errorMessage.textContent = "Une erreur s'est produite, les projets n'ont pas pu être chargés";
    errorMessage.style.color = "red"
    gallery.style.display = "flex"
    gallery.style.justifyContent = "center"
    gallery.appendChild(errorMessage);
}

// Fonction chargement data api
async function loadApi(api) {
    try {
        const dataResponse = await fetch(api);
        if (!dataResponse.ok) {
            throw new Error(`Erreur HTTP ${dataResponse.status}: ${dataResponse.statusText}`);
        }
        // Retourne les données JSON si tout va bien
        return await dataResponse.json();
    } catch (error) {
        console.error(`Erreur lors de la requête vers ${api}:`, error);
        throw error;
    }
}

// Fonction pour charger works, categories et de futurs éléments en parallèle
async function loadData() {
    try {
        const promises = apiGet.map(get => loadApi(`${apiUrl}${get}`));
        const results = await Promise.all(promises);

        const data = apiGet.reduce((acc, get, index) => {
            acc[get] = results[index];
            return acc;
        }, {});

        return data;
    } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
        // Retourner un objet vide pour éviter les erreurs dans le reste du code
        return {};
    }
}

// Fonction pour ajouter les boutons categories
function createBtns(categories) {
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
    });
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
        if (figure.classList.contains(`category-${button.dataset.category}`) || (button.dataset.category === "all")) {
            figure.style.opacity = '0';
            setTimeout(() => {
                figure.style.display = "block";
                setTimeout(() => {
                    figure.style.opacity = '1';
                }, 200);
            }, 100);
        } else {
            figure.style.opacity = '0';
            setTimeout(() => {
                figure.style.display = "none";
            }, 100);
        }
    });
}

// Fonction pour activation du bouton et filtre selon bouton
function filtreBtns() {
    const buttons = document.querySelectorAll('.btn-filter');
    const figureData = document.querySelectorAll('.figureFilter');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.setAttribute('aria-selected', 'false')); // Désactiver tous les boutons
            button.setAttribute('aria-selected', 'true'); // Activer le bouton cliqué
            filtreWorks(figureData, button);
        });
    });
}

function logout() {
    if (localStorage.getItem("authToken")) {
        localStorage.removeItem("authToken");
    }
}
// Lancer la fonction au démarrage de la page
export async function init() {
    if (localStorage.getItem('authToken')) {
        const body = document.querySelector('body');
        const token = localStorage.getItem("authToken");
        const loginLink = document.querySelector('#login');
        const projectsTitle = document.querySelector('.projects-title');
        const btnsContainer = document.querySelector('.btns-container')
        loginLink.textContent = 'logout';
        loginLink.href = "./index.html";
        btnsContainer.style.display = "none";
        body.classList.toggle('edit-mode');
        projectsTitle.style.marginLeft = '105px';
        projectsTitle.style.marginBottom = '80px';
        loginLink.addEventListener('click', () => {
            logout();
        })
        console.log("Token trouvé :", token);
    } else {
        console.log("Aucun token trouvé.");
    }
    const dataLoaded = await loadData();
    // Vérifiez que les données sont valides avant de créer les boutons et les works
    if (dataLoaded.works && dataLoaded.categories) {
        createBtns(dataLoaded.categories);
        createWorks(dataLoaded.works);
        filtreBtns();
    } else {
        errorApi(); // Si les données ne sont pas valides, afficher une erreur
    }
    console.log("Works:", dataLoaded.works || "Aucun work chargé");
    console.log("Categories:", dataLoaded.categories || "Aucune catégorie chargée");
}
