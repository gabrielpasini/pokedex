import { useEffect, useState } from "react";
import axios from "./axios";
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
const skeletonItems = new Array(cardsInScreen).fill(null);

const enumStats = ["HP", "ATK", "DEF", "SATK", "SDEF", "SPD"];

function App() {
  let timeout;
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [shiny, setShiny] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  async function getMorePokemon(url) {
    setLoading(true);
    const { data } = await axios.get(
      url ?? `pokemon?limit=${cardsInScreen}&offset=0`
    );
    setResponse(data);
    setLoading(false);
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

  function selectPokemon({ focusedIndex, card }) {
    if (!isMobile) {
      document.onmousemove = ({ x, y }) => animate({ x, y });
    }
    setSelectedCard(
      focusedIndex !== undefined ? response?.results?.[focusedIndex] : card
    );
  }

  function closeSearch() {
    if (selectedCard) {
      setSelectedCard(null);
      if (!isMobile) {
        document.onmousemove = undefined;
        animate({ x: 0, y: 0, stop: true });
      }
    }
  }

  async function searchPokemon() {
    try {
      if (search) {
        setLoadingSearch(true);
        const { data: card } = await axios.get(
          `pokemon/${search.replace(/ /g, "-")}`
        );
        if (card) selectPokemon({ card });
      }
    } finally {
      setLoadingSearch(false);
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
    <div className="container">
      <div className="toolbar">
        <div className="switch-container">
          <input
            id="flat"
            className="switch flat"
            type="checkbox"
            value={shiny}
            onChange={() => setShiny(!shiny)}
          />
          <label htmlFor="flat" />
          <span className="shiny">shiny</span>
        </div>
        <div className="search-container">
          <input
            placeholder="type to search..."
            className="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value.toLowerCase().replace(/[^a-z0-9 ]/g, "")
              )
            }
            onKeyUp={(event) => event.keyCode === 13 && searchPokemon()}
          />
          <button className="search-button" onClick={searchPokemon}>
            <img className="search-icon" src="/assets/search.svg" alt="" />
          </button>
        </div>
      </div>
      {response?.previous && (
        <img
          className={"action-button previous"}
          src="/assets/left.svg"
          alt=""
          onClick={() =>
            !loading &&
            response?.results?.[0].id > 1 &&
            response?.previous &&
            getMorePokemon(response?.previous)
          }
        />
      )}
      {response?.next && (
        <img
          className={"action-button next"}
          src="/assets/right.svg"
          alt=""
          onClick={() =>
            !loading && response?.next && getMorePokemon(response?.next)
          }
        />
      )}
      {selectedCard && (
        <img
          className={"action-button close"}
          src="/assets/close.svg"
          alt=""
          onClick={closeSearch}
        />
      )}
      <div className="card-rail">
        {loading &&
          skeletonItems?.map((_, index) => (
            <div className="skeleton" key={`skeleton_${index}`} />
          ))}
        {!loading &&
          response?.results.length &&
          response?.results?.map((pokemon, index) => {
            const { id, name, sprites, types } = pokemon;
            return (
              <div className="card" key={`${name}_${id}`}>
                <div
                  className="card-container"
                  onClick={() =>
                    !selectedCard && selectPokemon({ focusedIndex: index })
                  }
                >
                  <p className="number">#{id}</p>
                  <p className="name">{name.replace(/-/g, " ")}</p>
                  <div className="card-content">
                    <div className="card-bg" />
                    <img
                      className="card-img"
                      src={
                        shiny ? sprites?.front_shiny : sprites?.front_default
                      }
                      alt=""
                    />
                    <div className="card-text">
                      {types?.length > 0 &&
                        types?.map(({ type }) => (
                          <p
                            className={`card-title ${type.name}`}
                            key={type.name}
                          >
                            {type.name}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      {selectedCard && (
        <div className="container-overlay selected">
          <div className="focused-card-container">
            <p className="number">#{selectedCard.id}</p>
            <p className="name">{selectedCard.name.replace(/-/g, " ")}</p>
            <div className="card-content focused">
              <div className="focused-card-bg" />
              <img
                className="focused-card-img"
                src={
                  shiny
                    ? selectedCard?.sprites.front_shiny
                    : selectedCard?.sprites.front_default
                }
                alt=""
              />
            </div>
            <div className="card-details">
              <>
                {selectedCard.types?.length > 0 &&
                  selectedCard.types?.map(({ type }, index) => (
                    <p className={`card-title ${type.name}`} key={index}>
                      {type.name}
                    </p>
                  ))}
              </>
              <div className="card-info">
                <div>
                  <img src="/assets/height.svg" />
                  <span>{selectedCard.height / 10}m</span>
                </div>
                <div>
                  <img src="/assets/weight.svg" />
                  <span>{selectedCard.weight / 10}kg</span>
                </div>
              </div>
              {selectedCard.stats.map((stat, index) => (
                <div className="stats-line" key={index}>
                  <span className="title">{enumStats[index]}</span>
                  <div className="bar background">
                    <div
                      className={`bar ${selectedCard.types[0].type.name}`}
                      style={{ width: stat.base_stat / 2 }}
                    />
                  </div>
                  <span className="value">{stat.base_stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <a className="contact-link" target="_blank" href="https://pasini.dev">
        contact
      </a>
      {isMobile && <span className="notice">view on desktop for parallax</span>}
      {loadingSearch && <div className="container-overlay">Searching...</div>}
    </div>
  );
}

export default App;
