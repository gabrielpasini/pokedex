import { useEffect, useState } from "react";
import axios from "axios";
import "./App.scss";

const CARD_SCALE = 2;
const CARD_MARGIN = 20;
const CARD_WIDTH = 240 + CARD_MARGIN * 2;
const CARD_HEIGHT = 300 + CARD_MARGIN * 2;

const parallaxRange = 40;
const isMobile = window.innerWidth < 768;
const cardsInScreen = Math.floor(
  isMobile ? window.innerHeight / CARD_HEIGHT : window.innerWidth / CARD_WIDTH
);

function App() {
  let timeout;
  const [response, setResponse] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  async function getMorePokemon(url) {
    const { data } = await axios.get(
      url ?? `https://pokeapi.co/api/v2/pokemon?limit=${cardsInScreen}&offset=0`
    );
    setResponse(data);
  }

  async function getPokemon(url) {
    const { data } = await axios.get(url);
    return data;
  }

  async function getCompletedList() {
    const promises = response?.results?.map(({ url }) => getPokemon(url));
    const completedList = await Promise.all(promises);

    setResponse({ ...response, results: completedList, completedList: true });
  }

  function calcValue(a, b) {
    return ((a / b) * parallaxRange - parallaxRange / 2).toFixed(1);
  }

  function animate({ x, y, stop = false }) {
    if (timeout) window.cancelAnimationFrame(timeout);

    timeout = window.requestAnimationFrame(() => {
      const focusedCard = document.querySelector(".focused-card-container");
      const focusedImage = document.querySelector(".focused-card-img");
      const focusedBackground = document.querySelector(".focused-card-bg");

      const yValue = calcValue(y, window.innerHeight);
      const xValue = calcValue(x, window.innerWidth);

      focusedCard.style.transform = stop
        ? `scale(${CARD_SCALE}) rotateX(${0}deg) rotateY(${0}deg)`
        : `scale(${CARD_SCALE}) rotateX(${-yValue}deg) rotateY(${xValue}deg)`;
      focusedImage.style.transform = stop
        ? `translateX(${0}px) translateY(${0}px)`
        : `translateX(${xValue}px) translateY(${yValue}px)`;
      focusedBackground.style.backgroundPosition = stop
        ? `${0}px ${0}px`
        : `${xValue * 0.45}px ${yValue * 0.45}px`;
    });
  }

  function startParallax(focusedIndex) {
    setSelectedCard(response?.results?.[focusedIndex]);
    document.onmousemove = ({ x, y }) => animate({ x, y });
  }

  function stopParallax() {
    if (selectedCard) {
      setSelectedCard(null);
      document.onmousemove = undefined;
      animate({ x: 0, y: 0, stop: true });
    }
  }

  useEffect(() => {
    if (response?.results?.length > 0 && !response?.completedList)
      getCompletedList();
  }, [response]);

  useEffect(() => {
    getMorePokemon();
  }, []);

  return (
    <div
      className={`container ${selectedCard ? "overlay" : ""}`}
      onClick={() => selectedCard && stopParallax()}
    >
      <img
        className="button previous"
        src="https://i.imgur.com/GFQg0SD.png"
        alt=""
        onClick={() =>
          response?.results?.[0].id > 0 && getMorePokemon(response?.previous)
        }
      />
      <img
        className="button next"
        src="https://i.imgur.com/BdgZ1r7.png"
        alt=""
        onClick={() => getMorePokemon(response?.next)}
      />
      <div className="card-rail">
        {response?.results?.map((pokemon, index) => {
          const { id, name, sprites, types } = pokemon;
          return (
            <div className="card" key={`${name}_${id}`}>
              <div
                className="card-container"
                onClick={() => !selectedCard && startParallax(index)}
              >
                <p className="number">#{id}</p>
                <p className="name">{name}</p>
                <div className="card-content">
                  <div className="card-bg" />
                  <img
                    className="card-img"
                    src={sprites?.front_default}
                    alt=""
                  />
                  <div className="card-text">
                    {types?.length > 0 &&
                      types?.map(({ type }) => (
                        <p className={`card-title ${type.name}`}>{type.name}</p>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedCard && (
        <div className="container-overlay">
          <div className="focused-card-container">
            <p className="number">#{selectedCard.id}</p>
            <p className="name">{selectedCard.name}</p>
            <div className="card-content">
              <div className="focused-card-bg" />
              <img
                className="focused-card-img"
                src={selectedCard.sprites?.front_default}
                alt=""
              />
              <div className="card-text">
                {selectedCard.types?.length > 0 &&
                  selectedCard.types?.map(({ type }) => (
                    <p className={`card-title ${type.name}`}>{type.name}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <span className="notice">view on desktop for parallax and details</span>
      <a className="contact-link" target="_blank" href="https://pasini.dev">
        contact
      </a>
    </div>
  );
}

export default App;
