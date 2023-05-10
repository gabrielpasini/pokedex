import axios from "axios";

const api = axios.create({
  baseURL: "https://pokeapi.co/api/v2/",
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error?.response?.data) {
      const snackbar = document.getElementById("snackbar");
      snackbar.innerHTML = `<img src="/src/assets/search.svg" class="icon"><span class="message">${error.response.data}</span>`;
      snackbar.className = "show error";
      setTimeout(function () {
        snackbar.className = snackbar.className.replace("show", "");
      }, 5000);
    }
    return Promise.reject(error);
  }
);

export default api;
