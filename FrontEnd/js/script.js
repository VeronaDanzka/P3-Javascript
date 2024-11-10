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

// Lancer la fonction au démarrage de la page et récupérer les résultats
async function init() {
    const dataLoaded = await loadData();
    const works = dataLoaded.works;
    const categories = dataLoaded.categories;
    
    console.log("Works:", works);
    console.log("Categories:", categories);
}

init();