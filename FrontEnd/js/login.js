import { apiUrl, apiPost } from './config.js';

// Fonction post api pour le login
async function loginPostApi(api, objectJson){
    try {
        const dataResponse = await fetch(api, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: objectJson
        });
        if (dataResponse.status === 404) {
            throw new Error(`Erreur user not found, ${dataResponse.status}: ${dataResponse.statusText}`);
        }
        else if (dataResponse.status === 401) {
            throw new Error(`Erreur user not authorized, ${dataResponse.status}: ${dataResponse.statusText}`);
        }
        // Retourne les données JSON si tout va bien
        return await dataResponse.json();
    } catch (error) {
        throw error;
        
    }
}

// Fonction submit du formulaire avec gestion des erreurs
function submitLogin() {
        const formLogin = document.querySelector(".login-form");
        formLogin.addEventListener("submit", async function (event) {
            event.preventDefault();
            const user = document.querySelector("#email");
            const password = document.querySelector("#password");
            const userInput = user.value;
            const passwordInput = password.value;
            const postObject = {"email": userInput,
                                "password": passwordInput};
            const postJson = JSON.stringify(postObject)
            try {
                const response = await loginPostApi(`${apiUrl}${apiPost[0]}`, postJson);
                localStorage.setItem("authToken", response.token); // Enregistre le token
                console.log(response.token)
                window.location.href = "../index.html"; // Redirige vers la page d'accueil
            } catch (error) {
                const errorMessages = document.querySelectorAll(".error-http")
                const errorMessage = document.querySelector(".error-login")
                errorMessages.forEach(errorMessage => {
                    if(errorMessage.style.display === "block"){
                        errorMessage.style.display = "none";
                    }
                });
                if (errorMessage.style.display === "block"){
                    errorMessage.style.display = "none";
                }
                if (error.message.includes("Failed to fetch")){                    
                    errorMessages.forEach(errorMessage => {
                        errorMessage.style.display = "block";
                    });                  
                }else{                    
                    errorMessage.style.display = "block";
                }
            }
        });
}
submitLogin();
 