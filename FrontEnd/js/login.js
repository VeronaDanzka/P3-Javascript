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

// Fonction pour définir un cookie et garder le login à la redirection
function setCookie(name, value, days) {
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${expiryDate.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict`;
}

// Fonction pour récupérer la valeur d'un cookie
export function getCookieValue(name) {
    if (document.cookie && (document.cookie.includes(name))) {
        const cookies = document.cookie.split('; ');
            for (const cookie of cookies) {
                const [key, value] = cookie.split('=');
                if (key === name) {
                    return decodeURIComponent(value); // dans le cas où le cookie contiendrait un caractère spécial
                }

            }

    } else {
        return null;
    }
}

// Fonction submit du formulaire avec gestion des erreurs
function submitLogin() {
    if(!getCookieValue("authToken")){
        const formLogin = document.querySelector(".login-form");
        formLogin.addEventListener("submit", async (event) => {
            event.preventDefault();
            const user = document.querySelector("#email");
            const password = document.querySelector("#password");
            let userInput = null
            let passwordInput = null
            if(user){
                userInput = user.value;
            }
            if(password){
                passwordInput = password.value;
            }
            if(userInput && passwordInput){
                const postObject = {"email": userInput,
                                    "password": passwordInput};
                const postJson = JSON.stringify(postObject)
                try {
                    const response = await loginPostApi(`${apiUrl}${apiPost[0]}`, postJson);
                    setCookie("authToken", response.token, 21) // Enregistre le token pour les prochaines sessions
                    window.location.href = "../index.html"; // Redirige vers la page d'accueil pour activer le mode edit
                } catch (error) {
                    const inputs = formLogin.querySelectorAll('input');
                    if (error.message.includes("Failed to fetch")){                    
                        formLogin.classList.add('error-server');
                    }
                    else {
                        formLogin.classList.add('error');
                    }
                    if(inputs){
                        inputs.forEach( input => {
                            input.addEventListener('focus', () => {
                                formLogin.classList.remove('error');
                                if (error.message.includes("Failed to fetch")){                    
                                    formLogin.classList.remove('error-server');
                                } 
                            })
                        })
                    }               
                }
            }
        });
    } else {
        window.location.href = "../index.html"; // cas où l'utilisateur reviens sur la page login.html en étant déjà connecté    
    }
}
if (window.location.pathname.includes("login.html")) {
    submitLogin();
}
