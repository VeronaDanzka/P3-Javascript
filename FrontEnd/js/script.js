import { apiUrl, apiGet, apiPost, apiDelete } from './config.js';
import { getCookie } from './login.js'

// Fonction erreur affichage api
function errorApi() {
    const gallery = document.querySelector('.gallery');
    if (gallery){
        gallery.classList.add('error');
    }
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
    if(btnsContainer){
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
}

// Fonction pour ajouter les works
function createWorks(works) {
    const gallery = document.querySelector('.gallery');
    if(gallery){
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
}

// Fonction pour filtrer les works
function filtreWorks(figures, button) {
    figures.forEach(figure => {
        if (figure.classList.contains(`category-${button.dataset.category}`) || (button.dataset.category === "all")) {
            setTimeout(() => {
                if (figure.classList.contains('hidden')){
                    figure.classList.remove('hidden');
                    figure.classList.add('block');
                }                
                setTimeout(() => {
                    if (figure.classList.contains('invisible')){
                        figure.classList.remove('invisible');
                        figure.classList.add('visible');
                    }                       
                }, 200);
            }, 100);
        } else {
            setTimeout(() => {
                figure.classList.remove('visible');
                figure.classList.add('invisible');
                setTimeout(() => {
                    figure.classList.add('hidden');
                }, 200);
            }, 100);
        }
    });
}

// Fonction pour activation du bouton et filtre selon bouton
function filtreBtns() {
    const buttons = document.querySelectorAll('.btn-filter');
    const figureData = document.querySelectorAll('.figureFilter');
    if(buttons){
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(btn => btn.setAttribute('aria-selected', 'false')); // Désactiver tous les boutons
                button.setAttribute('aria-selected', 'true'); // Activer le bouton cliqué
                if(figureData){
                    filtreWorks(figureData, button);
                }
            });
        });
    }
}

// fonction pour se déconnecter
function logout(name) {
    if (getCookie(name)) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
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
    const figures = document.querySelectorAll('.modal-works figure');
    if(figures){
        figures.forEach(figure => {
            const btnsDelete = figure.querySelector('.modal-works button');
            if(btnsDelete){
                // Demande de confirmation de suppression
                btnsDelete.addEventListener('click', async () => {
                    btnsDelete.classList.add('hidden');
                    const deleteConfirmationContainer = document.createElement('div');
                    const deleteYes = document.createElement('i');
                    const deleteNo = document.createElement('i');
                    deleteYes.className = "fa-solid fa-square-check";
                    deleteNo.className = "fa-solid fa-square-xmark";
                    deleteConfirmationContainer.className = "delete-confirmation";
                    deleteConfirmationContainer.appendChild(deleteYes);
                    deleteConfirmationContainer.appendChild(deleteNo);
                    figure.appendChild(deleteConfirmationContainer);
                    // Validation de suppression par l'utilisateur
                    deleteYes.addEventListener('click', async () => {
                        for (const work of works) {
                            if (`work-${work.id}` === btnsDelete.id) {
                                try {
                                    console.log(work.id);
                                    const displayWorks = document.querySelector('.display-works');
                                    if(displayWorks){
                                        if(displayWorks.classList.contains('error-server')){
                                            displayWorks.classList.remove('error-server');             
                                        };
                                    }
                                    // Appel API pour supprimer works
                                    await deleteWorkApi(apiUrl, apiDelete, work.id);

                                    // mise à jour des works modale
                                    loadModal();
                                    
                                    // mise à jour des works background
                                    const newWorks = works.filter(work => `work-${work.id}` !== btnsDelete.id);
                                    createWorks(newWorks);
                                    console.log("new works:",newWorks)

                                } catch (error) {
                                    console.log(error);
                                    
                                }
                            }
                        }
                    });
                    // Suppression refusée par l'utilisateur
                    deleteNo.addEventListener('click', () => {
                        btnsDelete.classList.remove('hidden');
                        figure.removeChild(deleteConfirmationContainer);
                    });
                });
            }
        });
    }
}

// fonction pour fermer la modale 
function closeModal(){
    const body = document.querySelector('body');
    const modalContainer = document.querySelector('.modal-container');
    const modalWorks = document.querySelector('.modal-works');
    if(modalContainer){
        modalContainer.classList.add('close');
    }
    body.classList.remove('hidden');
    if(modalWorks){
        modalWorks.innerHTML = "";
    }
}

//fonction pour retourner en arrière dans la modale
function returnModal(modal, displayAdd, displayWorks){
    if(displayAdd){
        if(modal){
            modal.classList.add('overflow');
            displayAdd.classList.remove('visible');
            setTimeout(() => {
                displayAdd.classList.remove('open');
                modal.classList.add('overflow');                        
            }, 200)
        }
    }
    setTimeout(() => {
        if(displayWorks){
            displayWorks.classList.remove('hidden');
        }
    }, 200);
    setTimeout(() => {
        if(displayWorks){
            displayWorks.classList.remove('opacity');
        }
    }, 300);
}

// fonction pour l'ajout photo de la modale
function addPhoto(categories) {
    const modal = document.querySelector('.modal');
    const buttonAddPhoto = document.getElementById('add-work');
    const displayAdd = document.querySelector('.display-add');
    const displayWorks = document.querySelector('.display-works');
    const categorySelect = document.getElementById('categories');
    const buttonValidatePhoto = document.querySelector('.add-photo-btn');
    const form = document.getElementById('image-upload-form');
    const formTitle = document.getElementById('title');
    const formCategories = document.getElementById('categories');
    const formImage = document.getElementById('image');
    const errorForm = document.querySelector('.error-form');
    const uploadButton = document.getElementById('upload-button');
    const errorImg = document.querySelector('.error-img');
    const returnIcone = document.querySelector('.fa-arrow-left');
    const closeIcone = displayAdd.querySelector('.fa-xmark');
    const imagePreview = document.getElementById('image-preview');


    setupModal(buttonAddPhoto, modal, displayWorks, displayAdd);
    createCategories(categorySelect, categories);
    setupFormValidation(form, formTitle, formCategories, formImage, buttonValidatePhoto, errorForm, errorImg, imagePreview);
    setupUploadButton(uploadButton, formImage, errorImg);    
    if(returnIcone){
        returnIcone.addEventListener('click', () =>{
            returnModal(modal, displayAdd, displayWorks);
        })
    }
    if(closeIcone){
        closeIcone.addEventListener('click', () =>{
            closeModal();
        })
    }
}

// fonction pour affichage steps de la modale
function setupModal(buttonAddPhoto, modal, displayWorks, displayAdd) {
    if (buttonAddPhoto) {
        buttonAddPhoto.addEventListener('click', () => {
            if (displayWorks) {
                if (modal) {
                    modal.classList.add('overflow');
                    displayWorks.classList.add('opacity');
                    setTimeout(() => {
                        displayWorks.classList.add('hidden');
                        modal.classList.remove('overflow');
                    }, 200);
                }
            }
            setTimeout(() => {
                if (displayAdd) {
                    displayAdd.classList.add('open');
                }
            }, 200);
            setTimeout(() => {
                if (displayAdd) {
                    displayAdd.classList.add('visible');
                }
            }, 300);
        });
    }
}

// fonction pour créer les options de catégories dans select
function createCategories(categorySelect, categories) {
    if (categorySelect) {
        const firstOption = document.createElement('option');
        firstOption.value = "";
        firstOption.disabled = true;
        firstOption.selected = true;

        categorySelect.innerHTML = "";
        categorySelect.appendChild(firstOption);

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
}

// fonction pour image preview 
function imgPreview(file, imagePreview){
    const imageUrl = URL.createObjectURL(file);
    const previewContainer = document.getElementById('preview-container');
    const imageUpload = document.querySelector('.image-upload')
    if(imagePreview){
        imagePreview.src = imageUrl;
    }
    if(previewContainer){
        previewContainer.classList.add('image');
    }
    if(imageUpload){
        imageUpload.classList.add('hidden');       
    }
}

// fonction pour vérifier la validité du formulaire 
function setupFormValidation(form, formTitle, formCategories, formImage, buttonValidatePhoto, errorForm, errorImg, imagePreview) {
    if (form) {
        form.addEventListener('input', () => {
            if (formTitle && formCategories && formImage) {
                if (!formTitle.value && formCategories.value) {
                    if (errorForm) {
                        errorForm.classList.add('visible');
                    }
                } else {
                    if (errorForm) {
                        errorForm.classList.remove('visible');
                    }
                }

                if (formTitle.value && formCategories.value && formImage.files.length > 0) {
                    if (buttonValidatePhoto) {
                        buttonValidatePhoto.disabled = false;
                        buttonValidatePhoto.classList.add('enabled');
                    }
                } else {
                    buttonValidatePhoto.disabled = true;
                    buttonValidatePhoto.classList.remove('enabled');
                }
            }
        });

        form.addEventListener('change', () => {
            if (formImage.files.length > 0) {
                const validExtensions = ['jpg', 'jpeg', 'png'];
                const file = formImage.files[0];
                const fileExtension = file.name.split('.').pop().toLowerCase();
                if (validExtensions.includes(fileExtension)) {
                    console.log('Ceci est une image.');
                    imgPreview(file, imagePreview);
                } else {
                    if (errorImg) {
                        errorImg.classList.add('visible');
                    }
                    console.log("Ce fichier n'est pas une image.");
                }
            }
        });
    }
}


// fonction pour mettre le click de l'input file sur bouton
function setupUploadButton(uploadButton, formImage, errorImg) {
    if (uploadButton) {
        uploadButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (formImage && !formImage.files.length) {
                formImage.click();
            }
            if (errorImg && errorImg.classList.contains('visible')) {
                errorImg.classList.remove('visible');
            }
        });
    }
}


// fonction pour ouvrir et charger la modale 
async function loadModal(){
    try{
        const dataLoaded = await loadData();    
        const works = dataLoaded.works
        const categories = dataLoaded.categories
        const modalContainer = document.querySelector('.modal-container');
        const modalWorks = document.querySelector('.modal-works');
        const body = document.querySelector('body');
        const iconeClose = document.querySelector('.fa-xmark')
        body.classList.add('hidden');
        if(modalWorks){
            modalWorks.innerHTML = "";
        }
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
        addPhoto(categories);
        if(modalContainer){
            modalContainer.classList.remove('close');
            modalContainer.addEventListener('click', (event) => {
                if (event.target === event.currentTarget){
                    closeModal();
                };          
            });
        }
        if(iconeClose){
            iconeClose.addEventListener('click', () => {
                closeModal(); 
            });
        }
    }catch{
        errorModal()  
    }
}

// Fonction d'ouverture de la modale erreur api
function errorModal(){
    const modalContainer = document.querySelector('.modal-container');
    const modalWorks = document.querySelector('.modal-works');
    const body = document.querySelector('body');
    const iconeClose = document.querySelector('.fa-xmark')
    const displayWorks = document.querySelector('.display-works');
    body.classList.add('hidden');
    if(modalWorks){
        modalWorks.innerHTML = "";
    }
    if(modalContainer){
        modalContainer.classList.remove('close');
        modalContainer.addEventListener('click', (event) => {
            if (event.target === event.currentTarget){
                closeModal();
            };          
        });
    }
    if(displayWorks){
        displayWorks.classList.add('error-server');
    }
    if(iconeClose){
        iconeClose.addEventListener('click', () => {
            closeModal(); 
        });
    }    
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
        if(loginLink){
            loginLink.textContent = 'logout';
            loginLink.href = "./index.html";
            loginLink.addEventListener('click', () => {
                logout('authToken');
            });
        }
        if(btnsContainer){        
            btnsContainer.classList.toggle('hidden');
        }
        body.classList.toggle('edit-mode');
        if(projectsTitle){
            projectsTitle.classList.toggle('edit-mode');
        }
        if(modalListeners){
            modalListeners.forEach(listener => {
                listener.addEventListener('click', () => {                
                    if (dataLoaded.works && dataLoaded.categories) {
                        loadModal();
                    } else {
                        errorModal();
                    }
                })
            });
        }
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
