import { apiUrl, apiGet, apiPost, apiDelete } from './config.js';
import { getCookieValue } from './login.js'

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
            figure.classList.add('figureFilter');
            figure.dataset.workCategory = work.categoryId;
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
        if (figure.dataset.workCategory === button.dataset.category || button.dataset.category === "all") {
            setTimeout(() => {
                if (figure.classList.contains('hidden')){
                    figure.classList.remove('hidden');
                    figure.setAttribute('aria-hidden', 'false')
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
                    figure.setAttribute('aria-hidden', 'true')
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
    if (getCookieValue(name)) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
}


// fonction pour api fetch delete
async function deleteWorkApi(api, apiDelete, workId, token){
    try {
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
async function deleteWork(works, token, addPhotoLoaded) {
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
                                    const displayWorks = document.querySelector('.display-works');
                                    const errorHttpWorks = displayWorks.querySelector('.error-http');
                                    const errorSuppr = displayWorks.querySelector('.error-suppr');
                                    if(displayWorks){
                                        if(displayWorks.classList.contains('error-server')){
                                            displayWorks.classList.remove('error-server');
                                            if(errorHttpWorks){
                                                errorHttpWorks.setAttribute('aria-hidden', 'true')
                                            }             
                                        };
                                        if(displayWorks.classList.contains('error-suppr-http')){
                                            displayWorks.classList.remove('error-suppr-http');
                                            if(errorSuppr){
                                                errorSuppr.setAttribute('aria-hidden', 'true')
                                            }
                                        }
                                    }
                                    // Appel API pour supprimer works
                                    await deleteWorkApi(apiUrl, apiDelete, work.id, token);

                                    // mise à jour des works modale
                                    loadModal(token, addPhotoLoaded);
                                    
                                    // mise à jour des works background
                                    const newWorks = works.filter(work => `work-${work.id}` !== btnsDelete.id);
                                    createWorks(newWorks);
                                    
                                } catch (error) {
                                    const displayWorks = document.querySelector('.display-works');
                                    const errorSuppr = displayWorks.querySelector('.error-suppr');
                                    if(displayWorks){
                                            displayWorks.classList.add('error-suppr-http');
                                            if(errorSuppr){
                                                errorSuppr.setAttribute('aria-hidden', 'false')
                                            }
                                        }
                                    
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
    const submitSuccess = document.querySelector('.submit-success');
    if(modalContainer){
        modalContainer.classList.add('close');
    }
    body.classList.remove('hidden');
    if(modalWorks){
        modalWorks.innerHTML = "";
    }
    if(submitSuccess){
        submitSuccess.classList.add('hidden');
        submitSuccess.setAttribute('aria-hidden', 'true');        
    }
}

//fonction pour retourner en arrière dans la modale
function returnModal(modal, displayAdd, displayWorks){
    if(displayAdd){
        displayAdd.setAttribute('aria-hidden', 'true');
        if(modal){
            modal.classList.add('overflow');
            displayAdd.classList.remove('visible');
            setTimeout(() => {
                displayAdd.classList.remove('open');                      
            }, 200)
            setTimeout(() => {
                modal.classList.remove('overflow');                      
            }, 500)
        }
    }
    setTimeout(() => {
        if(displayWorks){
            displayWorks.setAttribute('aria-hidden', 'false');
            displayWorks.classList.remove('hidden');
        }
    }, 200);
    setTimeout(() => {
        if(displayWorks){
            displayWorks.classList.remove('opacity');
        }
    }, 300);
}

// fonction pour reset le formulaire 
function resetForm(form, buttonValidatePhoto, errorObject){
    const imageUploadHidden = document.querySelector('.image-upload.hidden');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const formImage = document.getElementById('image'); 
    if (errorObject.errorForm && errorObject.errorForm.classList.contains('visible')) {
            errorObject.errorForm.classList.remove('visible');
            errorObject.errorForm.setAttribute('aria-hidden', 'true');
        }
    if (errorObject.errorImg && errorObject.errorImg.classList.contains('visible')) {
            errorObject.errorImg.classList.remove('visible');
            errorObject.errorImg.setAttribute('aria-hidden', 'true');
    
    }
    if (errorObject.errorSize && errorObject.errorSize.classList.contains('visible')) {
            errorObject.errorSize.classList.remove('visible');
            errorObject.errorSize.setAttribute('aria-hidden', 'true');
        }
    if(form){ 
        const select = form.elements['categories'];
        form.reset();
        select.value = null;
    }
    if (formImage) {
        formImage.value = null;
    }
    if (imagePreview) {
        imagePreview.src = '#';
        imagePreview.classList.add('hidden');
        imagePreview.setAttribute('aria-hidden', 'true');
    }           
    if(imageUploadHidden){
        imageUploadHidden.classList.remove('hidden');
        imageUploadHidden.setAttribute('aria-hidden', 'false');
    }
    if(previewContainer){
        previewContainer.classList.remove('image');
    }
    if(buttonValidatePhoto){
        buttonValidatePhoto.disabled = true;
        buttonValidatePhoto.classList.remove('enabled');
    }
}

// fonction pour l'ajout photo de la modale
function addPhoto(categories, token) {
    const modal = document.querySelector('.modal');
    const buttonAddPhoto = document.getElementById('add-work');
    const displayAdd = document.querySelector('.display-add');
    const displayWorks = document.querySelector('.display-works');
    const categorySelect = document.getElementById('categories');
    const buttonValidatePhoto = document.querySelector('.add-photo-btn');
    const form = document.getElementById('image-upload-form');
    const errorForm = document.querySelector('.error-form');
    const errorImg = document.querySelector('.error-img');
    const errorSize = document.querySelector('.error-size');
    const returnIcone = document.querySelector('.fa-arrow-left');
    const closeIcone = displayAdd.querySelector('.fa-xmark');
    const imagePreview = document.getElementById('image-preview');
    const errorHttpAdd = displayAdd.querySelector('.error-http');
    const errorHttpWorks = displayWorks.querySelector('.error-http');
    const errorSuppr = displayWorks.querySelector('.error-suppr');
    const errorObject = {};
    if (errorForm) {
        errorObject.errorForm = errorForm;
    }
    if (errorImg) {
        errorObject.errorImg = errorImg;
    }
    if (errorSize) {
        errorObject.errorSize = errorSize;
    }




    setupModal(buttonAddPhoto, modal, displayWorks, displayAdd);
    createCategories(categorySelect, categories);
    setupFormValidation(form, errorObject, imagePreview, token);    
    if(returnIcone){
        returnIcone.addEventListener('click', () =>{
            returnModal(modal, displayAdd, displayWorks);
        })
    }
    if(closeIcone){
        closeIcone.addEventListener('click', () =>{
                if(displayWorks){
                    displayWorks.classList.remove('error-server');
                    if(errorHttpWorks){
                        errorHttpWorks.setAttribute('aria-hidden', 'true');  
                    }
                    if(displayWorks.classList.contains('error-suppr-http')){
                        displayWorks.classList.remove('error-suppr-http');
                        if(errorSuppr){
                            errorSuppr.setAttribute('aria-hidden', 'true');
                        }
                    }
                }
                if(displayAdd){
                    displayAdd.classList.remove('error-server');
                    if(errorHttpAdd){
                        errorHttpAdd.setAttribute('aria-hidden', 'true');  
                    }
                }
                closeModal();
                resetForm(form, buttonValidatePhoto, errorObject);
                returnModal(modal, displayAdd, displayWorks);                     
        })
    }
}

// fonction pour affichage steps de la modale
function setupModal(buttonAddPhoto, modal, displayWorks, displayAdd) {
    if (buttonAddPhoto) {
        buttonAddPhoto.addEventListener('click', () => {
            if (displayWorks) {
                displayWorks.setAttribute('aria-hidden', 'true');
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
                    displayAdd.setAttribute('aria-hidden', 'false');
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
        categorySelect.required = true;
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

// mettre à jour les projets dans la modale dans le cas où l'utilisateur retourne à la step 1 et en arrière plan
async function updateProjects(token){
    const dataLoaded = await loadData();
    if (dataLoaded.works){
        createWorks(dataLoaded.works);  
    }
    loadModal(token, true)
}

// fonction pour envoyer le nouveau projet via l'API
async function sendNewProject(form, file, title, category, token, errorObject){
    if (form) {
        const buttonValidatePhoto = form.querySelector('.add-photo-btn');
        const formData = new FormData(); // utilisation de FormData pour multipart/form-data
        if(file && title && category){
            formData.append('image', file); 
            formData.append('title', title); 
            formData.append('category', category);
            try {
                const response = await fetch(`${apiUrl}${apiPost[1]}`, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (response.ok) {
                    const displayAdd = document.querySelector('.display-add');
                    const displayWorks = document.querySelector('.display-works');
                    const submitSuccess = document.querySelector('.submit-success.hidden');
                    if(displayAdd){
                        if(displayAdd.classList.contains('error-server')){
                            displayAdd.classList.remove('error-server');
                        }
                        
                    }
                    if(displayWorks){
                        if(displayWorks.classList.contains('error-server')){
                            displayWorks.classList.remove('error-server');
                        }
                        if(displayWorks.classList.contains('error-suppr-http')){
                            displayWorks.classList.remove('error-suppr-http');
                        }
                        
                    }
                    if(submitSuccess){
                        submitSuccess.classList.remove('hidden');
                        submitSuccess.setAttribute('aria-hidden', 'false')
                    }
                    resetForm(form, buttonValidatePhoto, errorObject);
                    updateProjects(token);
                }
            } catch (error) {
                errorModal();
            }
        } 
    } 
        
}

// fonction pour image preview 
function imgPreview(file, imagePreview){
    const imageUrl = URL.createObjectURL(file);
    const previewContainer = document.getElementById('preview-container');
    const imageUpload = document.querySelector('.image-upload');
    if(imagePreview){
        imagePreview.src = imageUrl;
        if(imagePreview.classList.contains('hidden')){
            imagePreview.classList.remove('hidden');
        }
        imagePreview.setAttribute('aria-hidden', 'false');
    }
    if(previewContainer){
        previewContainer.classList.add('image');
    }
    if(imageUpload){
        imageUpload.classList.add('hidden');
        imageUpload.setAttribute('aria-hidden', 'true');       
    }
    
}

// fonction pour vérifier la validité du formulaire 
function setupFormValidation(form, errorObject, imagePreview, token) {
    if (form) {
        const formTitle = document.getElementById('title');
        const formCategories = document.getElementById('categories');
        const formImage = document.getElementById('image');
        const uploadButton = document.getElementById('upload-button');
        const buttonValidatePhoto = form.querySelector('.add-photo-btn')
        form.addEventListener('input', () => {
            if (formTitle && formCategories && formImage) {
                if (!formTitle.value && formCategories.value) {
                    if (errorObject.errorForm) {
                        errorObject.errorForm.classList.add('visible');
                        errorObject.errorForm.setAttribute('aria-hidden', 'false')
                    }
                } else {
                    if (errorObject.errorForm) {
                        errorObject.errorForm.classList.remove('visible');
                        errorObject.errorForm.setAttribute('aria-hidden', 'true')
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
        form.addEventListener('submit', (event) =>{
            event.preventDefault();
            const file = formImage.files[0];
            if (formTitle.value && formCategories.value && formImage.files.length > 0){
                sendNewProject(form, file, formTitle.value, formCategories.value, token, errorObject);
            } 
        })
        if(formImage){
            formImage.addEventListener('change', () => {
                if (formImage.files.length > 0) {
                    const validExtensions = ['jpg', 'jpeg', 'png'];
                    const file = formImage.files[0];
                    const maxSizeInBytes = 4 * 1024 * 1024;
                    const fileExtension = file.name.split('.').pop().toLowerCase();
                    if (validExtensions.includes(fileExtension) && file.size <= maxSizeInBytes) {
                        imgPreview(file, imagePreview);
                    } 
                    if (!validExtensions.includes(fileExtension)){
                        if (errorObject.errorImg) {
                            errorObject.errorImg.classList.add('visible');
                            errorObject.errorImg.setAttribute('aria-hidden', 'false')
                        }
                        formImage.value = null;
                    }
                    if (file.size > maxSizeInBytes) {
                        if (errorObject.errorSize) {
                            errorObject.errorSize.classList.add('visible');
                            errorObject.errorSize.setAttribute('aria-hidden', 'false')
                        }
                        formImage.value = null;
                    }
                }
            });
        }    
        if(uploadButton){
            uploadButton.addEventListener('click', () =>{
                if (errorObject.errorImg) {
                    if(errorObject.errorImg.classList.contains('visible'))
                        errorObject.errorImg.classList.remove('visible');
                    errorObject.errorImg.setAttribute('aria-hidden', 'true')
                }
                if (errorObject.errorSize) {
                    if(errorObject.errorSize.classList.contains('visible'))
                        errorObject.errorSize.classList.remove('visible');
                    errorObject.errorSize.setAttribute('aria-hidden', 'true')
                }
                const submitSuccess = document.querySelector('.submit-success');
                if(submitSuccess){
                    submitSuccess.classList.add('hidden');
                    submitSuccess.setAttribute('aria-hidden', 'true')
                }
            })
        }
    }
    
}

// fonction pour ouvrir et charger la modale 
async function loadModal(token, addPhotoLoaded){
    try{
        const dataLoaded = await loadData();    
        const works = dataLoaded.works
        const categories = dataLoaded.categories
        const modalContainer = document.querySelector('.modal-container');
        const modalWorks = document.querySelector('.modal-works');
        const body = document.querySelector('body');
        const iconeClose = document.querySelector('.fa-xmark');
        const displayWorks = document.querySelector('.display-works');
        const errorSuppr = displayWorks.querySelector('.error-suppr');
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
        deleteWork(works, token, true);
        if(!addPhotoLoaded){
            addPhoto(categories, token);
            addPhotoLoaded = true;
        }
        if(modalContainer){
            modalContainer.classList.remove('close');
            modalContainer.setAttribute('aria-hidden', 'false');
            modalContainer.addEventListener('click', (event) => {
                if (event.target === event.currentTarget){
                    modalContainer.setAttribute('aria-hidden', 'true');
                    closeModal();
                    if(displayWorks && displayWorks.classList.contains('error-suppr-http')){
                        displayWorks.classList.remove('error-suppr-http');
                        if(errorSuppr){
                            errorSuppr.setAttribute('aria-hidden', 'true');
                        }
                    }
                };          
            });
        }
        if(iconeClose){
            iconeClose.addEventListener('click', () => {
                if(modalContainer){
                    modalContainer.setAttribute('aria-hidden', 'true');
                }
                if(displayWorks && displayWorks.classList.contains('error-suppr-http')){
                    displayWorks.classList.remove('error-suppr-http');
                    if(errorSuppr){
                        errorSuppr.setAttribute('aria-hidden', 'true');
                    }
                }
                closeModal(); 
            });
        } return addPhotoLoaded
    }catch(error){
        errorModal()
        return addPhotoLoaded  
    } 
}

// Fonction d'ouverture de la modale erreur api
function errorModal(){
    const modalContainer = document.querySelector('.modal-container');
    const modalWorks = document.querySelector('.modal-works');
    const body = document.querySelector('body');
    const iconeClose = document.querySelector('.fa-xmark')
    const displayWorks = document.querySelector('.display-works');
    const displayAdd = document.querySelector('.display-add');
    const errorHttpAdd = displayAdd.querySelector('.error-http');
    const errorHttpWorks = displayWorks.querySelector('.error-http');
    const errorSuppr = displayWorks.querySelector('.error-suppr');
    body.classList.add('hidden');
    if(modalWorks){
        modalWorks.innerHTML = "";
    }
    if(modalContainer){
        modalContainer.classList.remove('close');
        modalContainer.setAttribute('aria-hidden', 'false');
        modalContainer.addEventListener('click', (event) => {
            if (event.target === event.currentTarget){
                closeModal();
                if(displayWorks){
                    displayWorks.classList.remove('error-server');
                    if(errorHttpWorks){
                        errorHttpWorks.setAttribute('aria-hidden', 'true');  
                    }
                }
                if(displayAdd){
                    displayAdd.classList.remove('error-server');
                    if(errorHttpAdd){
                        errorHttpAdd.setAttribute('aria-hidden', 'true');  
                    }
                }
                if(displayWorks.classList.contains('error-suppr-http')){
                    displayWorks.classList.remove('error-suppr-http');
                    if(errorSuppr){
                        errorSuppr.setAttribute('aria-hidden', 'true');
                    }
                }
            };          
        });
    }
    if(displayWorks){
        displayWorks.classList.add('error-server');
        if(displayWorks.classList.contains('error-suppr-http')){
            displayWorks.classList.remove('error-suppr-http');
            if(errorSuppr){
                errorSuppr.setAttribute('aria-hidden', 'true');
            }
        }
        if(errorHttpWorks){
            errorHttpWorks.setAttribute('aria-hidden', 'false');
        }
    }
    if(displayAdd){
        displayAdd.classList.add('error-server');
        if(errorHttpAdd){
            errorHttpAdd.setAttribute('aria-hidden', 'false');
        }

    }
    if(iconeClose){
        iconeClose.addEventListener('click', () => {
                closeModal();
                if(displayWorks){
                    displayWorks.classList.remove('error-server');
                    if(errorHttpWorks){
                        errorHttpWorks.setAttribute('aria-hidden', 'true');  
                    }
                    if(displayWorks.classList.contains('error-suppr-http')){
                        displayWorks.classList.remove('error-suppr-http');
                        if(errorSuppr){
                            errorSuppr.setAttribute('aria-hidden', 'true');
                        }
                    }
                }
                if(displayAdd){
                    displayAdd.classList.remove('error-server');
                    if(errorHttpAdd){
                        errorHttpAdd.setAttribute('aria-hidden', 'true');  
                    }
                }
        });
    }    
}

// Lancer la fonction au démarrage de la page
export async function init() {
    const dataLoaded = await loadData();
    const token = getCookieValue('authToken');
    if (token) {
        const body = document.querySelector('body');
        const loginLink = document.querySelector('#login');
        const projectsTitle = document.querySelector('.projects-title');
        const btnsContainer = document.querySelector('.btns-container');
        const modalListeners = document.querySelectorAll('[data-role="open-modal"]');
        const editOnly = document.querySelectorAll('.edit-only');
        if(loginLink){
            loginLink.textContent = 'logout';
            loginLink.href = "./index.html";
            loginLink.addEventListener('click', () => {
                logout('authToken');
            });
        }
        if(editOnly){
            editOnly.forEach(editElem => {
                editElem.setAttribute('aria-hidden', 'false');
            })            
        }
        if(btnsContainer){        
            btnsContainer.classList.toggle('hidden');
            btnsContainer.setAttribute('aria-hidden', 'true');
        }        
        body.classList.toggle('edit-mode');
        if(projectsTitle){
            projectsTitle.classList.toggle('edit-mode');
        }
        let addPhotoLoaded = false;
        if(modalListeners){
            modalListeners.forEach(listener => {
                listener.addEventListener('click', async () => {                
                    if (dataLoaded.works && dataLoaded.categories) {
                        addPhotoLoaded = await loadModal(token, addPhotoLoaded);
                    } else {
                        errorModal();
                    }
                })
            });
        }
    }
    // Vérifiez que les données sont valides avant de créer les boutons et les works
    if (dataLoaded.works && dataLoaded.categories) {
        createBtns(dataLoaded.categories);
        createWorks(dataLoaded.works);
        filtreBtns();
    } else {
        errorApi(); // Si les données ne sont pas valides, afficher une erreur
    }
}
