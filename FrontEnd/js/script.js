import { apiUrl, apiGet, apiPost, apiDelete } from './config.js';
import { getCookie } from './login.js'

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

// fonction pour se déconnecter
function logout(name) {
    if (getCookie(name)) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
}

// fonction pour fermer la modale 
function closeModal(){
    const body = document.querySelector('body');
    const modalContainer = document.querySelector('.modal-container');
    const displayWorks = document.querySelector('.display-works');
    const modalWorks = document.querySelector('.modal-works');
    modalWorks.style.display = "none";
    modalContainer.style.display = "none";
    displayWorks.style.display = "none";
    body.style.overflow = "auto";
    modalWorks.innerHTML = "";

}

// fonction pour api fetch delete
async function deleteWorkApi(api, apiDelete, workId){
    try {
        const token = localStorage.getItem('authToken');
        const dataResponse = await fetch(`${api}${apiDelete[0]}/${workId}`, {
            method: "delete",
            headers: {
                'accept': '*/*',
                'authorization': `Bearer ${token}`
            }
        });
        if (dataResponse.status === 404) {
            throw new Error(`Erreur user not found, ${dataResponse.status}: ${dataResponse.statusText}`);
        }
        else if (dataResponse.status === 500) {
            throw new Error(`Erreur unexpected behavior, ${dataResponse.status}: ${dataResponse.statusText}`);
        }
    } catch (error) {
        throw error;
        
    }
}

// fonction pour supprimer des works 
async function deleteWork(works) {
    let newWorks = works;
    const figures = document.querySelectorAll('.modal-works figure');
    figures.forEach(figure => {
        const btnsDelete = figure.querySelector('.modal-works button');
        btnsDelete.addEventListener('click', async () => {
            btnsDelete.style.display = "none";
            const deleteConfirmationContainer = document.createElement('div');
            const deleteYes = document.createElement('i');
            const deleteNo = document.createElement('i');
            deleteYes.className = "fa-solid fa-square-check";
            deleteNo.className = "fa-solid fa-square-xmark";
            deleteConfirmationContainer.className = "delete-confirmation";
            deleteConfirmationContainer.appendChild(deleteYes);
            deleteConfirmationContainer.appendChild(deleteNo);
            figure.appendChild(deleteConfirmationContainer);

            deleteYes.addEventListener('click', async () => {
                for (const work of works) {
                    if (`work-${work.id}` === btnsDelete.id) {
                        try {
                            console.log(work.id);
                            const displayWorks = document.querySelector('.display-works');
                            const errorMessage = displayWorks.querySelectorAll('.error-http');
                            errorMessage.forEach(message => {
                                const computedStyle = window.getComputedStyle(message);
                                if (computedStyle.display === "block") {
                                    message.style.display = "none";
                                }
                            });

                            // Appel API pour supprimer works
                            await deleteWorkApi(apiUrl, apiDelete, work.id);

                            // mise à jour des works modale
                            loadModal();
                            
                            // mise à jour des works background
                            newWorks = works.filter(work => `work-${work.id}` !== btnsDelete.id);
                            createWorks(newWorks);
                            console.log("new works:",newWorks)

                        } catch (error) {
                            console.log(error);
                            const displayWorks = document.querySelector('.display-works');
                            const errorMessage = displayWorks.querySelectorAll('.error-http');
                            errorMessage.forEach(message => {
                                const computedStyle = window.getComputedStyle(message);
                                if (computedStyle.display === "none") {
                                    message.style.display = "block";
                                }
                            });
                        }
                    }
                }
            });
            deleteNo.addEventListener('click', () => {
                btnsDelete.style.display = "flex";
                figure.removeChild(deleteConfirmationContainer);
            });
        });
    });
}


// fonction pour ouvrir et charger la modale 
async function loadModal(){
    const dataLoaded = await loadData();
    const works = dataLoaded.works
    const modalContainer = document.querySelector('.modal-container');
    const displayWorks = document.querySelector('.display-works');
    const modalWorks = document.querySelector('.modal-works');
    const body = document.querySelector('body');
    const iconeClose = document.querySelector('.fa-xmark')
    body.style.overflow = "hidden";
    modalWorks.innerHTML = "";
    works.forEach(work => {
        const figure = document.createElement('figure');
        const button = document.createElement('button');
        const deleteWork = document.createElement('i');
        const img = document.createElement('img');
        img.src = work.imageUrl;
        img.alt = work.title;
        button.id = `work-${work.id}`;
        deleteWork.className = "fa-solid fa-trash-can";
        button.appendChild(deleteWork);
        figure.appendChild(img);
        figure.appendChild(button);
        modalWorks.appendChild(figure);
    })
    deleteWork(works);
    modalWorks.style.display = "grid";
    modalContainer.style.display = "flex";
    displayWorks.style.display = "flex";
    iconeClose.addEventListener('click', () => {
        closeModal(); 
    });
    modalContainer.addEventListener('click', (event) => {
        if (event.target === event.currentTarget){
            closeModal();
        };          
    });
}

// Lancer la fonction au démarrage de la page
export async function init() {
    const dataLoaded = await loadData();
    if (getCookie('authToken')) {
        const body = document.querySelector('body');
        const token = localStorage.getItem("authToken");
        const loginLink = document.querySelector('#login');
        const projectsTitle = document.querySelector('.projects-title');
        const btnsContainer = document.querySelector('.btns-container');
        const modalListeners = document.querySelectorAll('.open-modal');
        loginLink.textContent = 'logout';
        loginLink.href = "./index.html";
        btnsContainer.style.display = "none";
        body.classList.toggle('edit-mode');
        projectsTitle.style.marginLeft = '105px';
        projectsTitle.style.marginBottom = '80px';
        loginLink.addEventListener('click', () => {
            logout('authToken');
        });
        modalListeners.forEach(listener => {
            listener.addEventListener('click', () => {                
                if (dataLoaded.works && dataLoaded.categories) {
                    loadModal();
                } else {
                    errorModal();
                }
            })
        });
        console.log("Token trouvé :", token);
    } else {
        console.log("Aucun token trouvé.");
    }
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
