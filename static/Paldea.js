// ==============================
// State & Elements
// ==============================

const dlcToggle = document.getElementById("dlcToggle");
const dlcSection = document.getElementById("dlc-section");
const pokemonCards = document.querySelectorAll(".pokemon-card");
const pokemonSearch = document.getElementById("pokemon-search");
const statusFilters = document.querySelectorAll(".status-filter");
const typeFilter = document.getElementById("type-filter");
const clearFilters = document.getElementById("clear-filters");
const shinyDisplayToggle = document.getElementById("shinyDisplayToggle");

// Load saved caught list from localStorage
let caughtPokemon = JSON.parse(
    localStorage.getItem("caughtPokemon")
) || [];


// ==============================
// DLC Toggle Handler
// ==============================

// Load saved DLC setting on startup
const dlcOwned = localStorage.getItem("dlcOwned");

if (dlcOwned === "true") {
    dlcToggle.checked = true;
    dlcSection.style.display = "block";
} else {
    dlcToggle.checked = false;
    dlcSection.style.display = "none";
}


// ==============================
// Caught Pokemon Handler
// ==============================

// Apply saved caught status on initial load
pokemonCards.forEach(function(card) {
    const pokemonName = card.dataset.pokemon;

    if (caughtPokemon.includes(pokemonName)) {
        card.classList.add("caught");
    }
});


// Click card to toggle caught status
pokemonCards.forEach(function(card) {

    card.addEventListener("click", function() {

        const pokemonName = card.dataset.pokemon;

        if (caughtPokemon.includes(pokemonName)) {

            // Remove from caught list
            caughtPokemon = caughtPokemon.filter(
                name => name !== pokemonName
            );

            card.classList.remove("caught");

        } else {

            // Add to caught list
            caughtPokemon.push(pokemonName);

            card.classList.add("caught");
        }

        // Save updated array
        localStorage.setItem(
            "caughtPokemon",
            JSON.stringify(caughtPokemon)
        );

        // Update progress bars
        updateProgress();
    });
});


// ==============================
// Shiny Pokemon Handler
// ==============================

let shinyPokemon = JSON.parse(
    localStorage.getItem("shinyPokemon")
) || [];

// ==============================
// Shiny Pokemon Handler
// ==============================

function toggleShiny(event, pokemonName) {

    // Prevent card click
    event.stopPropagation();

    const button = event.currentTarget;
    const card = button.closest(".pokemon-card");
    const pokemonImage = card.querySelector("img");
    const pokemon = findPokemonData(pokemonName);

    if (!pokemon) {
        console.error(
            "Could not find data for Pokémon:",
            pokemonName
        );

        return;
    }


    // ==============================
    // Remove Shiny
    // ==============================

    if (shinyPokemon.includes(pokemonName)) {

        shinyPokemon = shinyPokemon.filter(
            name => name !== pokemonName
        );

        button.classList.remove("active");

        pokemonImage.src =
            `/static/sprites/normal/${pokemon.national_id}.png`;

    }


    // ==============================
    // Add Shiny
    // ==============================

    else {

        shinyPokemon.push(pokemonName);

        button.classList.add("active");

        pokemonImage.src =
            `/static/sprites/shiny/${pokemon.national_id}.png`;

    }


    // Save shiny list
    localStorage.setItem(
        "shinyPokemon",
        JSON.stringify(shinyPokemon)
    );

}

document.querySelectorAll(".shiny-button").forEach(function(button) {

    const card = button.closest(".pokemon-card");
    const pokemonName = card.dataset.pokemon;

    const pokemon = findPokemonData(pokemonName);

    if (!pokemon) {
        return;
    }

    if (shinyPokemon.includes(pokemonName)) {

        button.classList.add("active");

        const pokemonImage =
            card.querySelector("img");

        pokemonImage.src =
            `/static/sprites/shiny/${pokemon.national_id}.png`;

    }

});

// ==============================
// SHINY SPRITES
// ==============================

function updateShinyDisplay() {
    pokemonCards.forEach(function(card) {

        const pokemonName =
            card.dataset.pokemon;

        const pokemon =
            findPokemonData(pokemonName);

        if (!pokemon) {
            return;
        }

        const pokemonImage =
            card.querySelector("img");

        if (shinyDisplayToggle.checked) {
            pokemonImage.src =
                `/static/sprites/shiny/${pokemon.national_id}.png`;
        } else {
            pokemonImage.src =
                `/static/sprites/normal/${pokemon.national_id}.png`;
        }
    });
}

shinyDisplayToggle.addEventListener(
    "change",
    updateShinyDisplay
);

// ==============================
// Search & Filters
// ==============================
function applyFilters() {

    const searchText =
        pokemonSearch.value.toLowerCase().trim();

    const selectedStatuses = Array.from(
        statusFilters
    )
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

    const selectedType =
        typeFilter.value;

    pokemonCards.forEach(function(card) {

        const pokemonName =
            card.dataset.pokemon.toLowerCase();

        const pokemon =
            findPokemonData(pokemonName);

        let show = true;


        // SEARCH
        if (
            searchText !== "" &&
            !pokemonName.includes(searchText)
        ) {
            show = false;
        }


        // STATUS
        if (show && selectedStatuses.length > 0) {

            const isCaught =
                caughtPokemon.includes(pokemonName);

            const isShiny =
                shinyPokemon.includes(pokemonName);

            if (
                selectedStatuses.includes("missing") &&
                isCaught
            ) {
                show = false;
            }

            if (
                selectedStatuses.includes("caught") &&
                !isCaught
            ) {
                show = false;
            }

            if (
                selectedStatuses.includes("shiny") &&
                !isShiny
            ) {
                show = false;
            }
        }


        // TYPE
        if (
            show &&
            selectedType !== "all" &&
            pokemon &&
            !pokemon.types.includes(selectedType)
        ) {
            show = false;
        }


        // SHOW / HIDE
        card.style.display =
            show ? "" : "none";

    });
}

    statusFilters.forEach(function(checkbox) {

        checkbox.addEventListener(
            "change",
            applyFilters
        );

    });



    typeFilter.addEventListener(
        "change",
        applyFilters
    );


    const autocompleteList =
    document.getElementById("autocomplete-list");

    pokemonSearch.addEventListener(
    "input",
    function() {

        const searchText =
            pokemonSearch.value.toLowerCase().trim();

        autocompleteList.innerHTML = "";

        if (searchText === "") {
            return;
        }

        const allPokemon = [
            ...(POKEDEX_DATA.paldea || []),
            ...(POKEDEX_DATA.kitakami || []),
            ...(POKEDEX_DATA.blueberry || [])
        ];

        const uniquePokemon = Array.from(
            new Map(
                allPokemon.map(pokemon => [
                    pokemon.name,
                    pokemon
                ])
            ).values()
        );


        const matches = uniquePokemon
            .filter(function(pokemon) {

                return pokemon.name
                    .toLowerCase()
                    .includes(searchText);

            })
            .slice(0, 8);


        matches.forEach(function(pokemon) {

            const item =
                document.createElement("div");

            item.classList.add("autocomplete-item");

            item.textContent =
                pokemon.name.charAt(0).toUpperCase() +
                pokemon.name.slice(1);

            item.addEventListener(
                "click",
                function() {

                    pokemonSearch.value =
                        pokemon.name;

                    autocompleteList.innerHTML = "";

                    applyFilters();

                }
            );

            autocompleteList.appendChild(item);

        });

});   

clearFilters.addEventListener(
    "click",
    function() {
        pokemonSearch.value = "";
        typeFilter.value = "all";

        statusFilters.forEach(function(checkbox) {
            checkbox.checked = false;
        });

        // Turn DLC off
        dlcToggle.checked = false;
        localStorage.setItem("dlcOwned", "false");

        // Hide DLC Pokémon
        dlcSection.style.display = "none";

        // Hide DLC progress bars
        document.getElementById("dlc-progress").style.display = "none";

        // Hide Shiny Sprites
        shinyDisplayToggle.checked = false;
        updateShinyDisplay();

        // Reset filters
        applyFilters();
    }
);

// ==============================
// RELEASE ALL POKEMON
// ==============================

function releaseAll() {

    document.getElementById("release-modal").style.display = "flex";

}

function cancelRelease() {

    document.getElementById("release-modal").style.display = "none";

}


function confirmRelease() {

    // Release all Pokemon
    caughtPokemon = [];

    // Save empty list
    localStorage.setItem(
        "caughtPokemon",
        JSON.stringify(caughtPokemon)
    );

    // Remove caught status from every card
    pokemonCards.forEach(function(card) {

        card.classList.remove("caught");

    });

    // Update progress
    updateProgress();

    // Close modal
    document.getElementById("release-modal").style.display = "none";

}

// ==============================
// DLC Toggle Handler
// ==============================

dlcToggle.addEventListener("change", function() {

    if (dlcToggle.checked) {

        dlcSection.style.display = "block";

        localStorage.setItem(
            "dlcOwned",
            "true"
        );

    } else {

        dlcSection.style.display = "none";

        localStorage.setItem(
            "dlcOwned",
            "false"
        );
    }

    // Update progress bars
    updateProgress();
});


// ==============================
// Location Display Names
// ==============================

const VERSION_NAMES = {
    "scarlet": "Scarlet",
    "violet": "Violet"
};

const METHOD_NAMES = {
    "symbol-encounter": "Wild Encounter",
    "tera-raid-battle": "Tera Raid Battle",
    "fixed-encounter": "Fixed Encounter",
    "special-encounter": "Special Encounter",
    "static-encounter": "Static Encounter",
    "fixed-tera-encounter": "Fixed Tera Encounter",
    "npc-gift": "NPC Gift"
};


// ==============================
// Pokemon Location Modal
// ==============================

// Helper: Look up a Pokemon object from global POKEDEX_DATA
function findPokemonData(pokemonName) {

    if (typeof POKEDEX_DATA === "undefined") {

        console.error(
            "POKEDEX_DATA is missing. Inject it in HTML script tags."
        );

        return null;
    }

    const allPokemon = [
        ...(POKEDEX_DATA.paldea || []),
        ...(POKEDEX_DATA.kitakami || []),
        ...(POKEDEX_DATA.blueberry || [])
    ];


    return allPokemon.find(
        p => p.name.toLowerCase() === pokemonName.toLowerCase()
    );
}


// Show modal with location entries
function showLocation(event, pokemonName) {

    // Prevent trigger of card 'caught' click event
    event.stopPropagation();

    const pokemon = findPokemonData(pokemonName);

    if (!pokemon) {

        console.error(
            "Could not find data for Pokémon:",
            pokemonName
        );

        return;
    }

    const modal = document.getElementById("location-modal");
    const name = document.getElementById("location-name");
    const list = document.getElementById("location-list");

    // Format header
    name.textContent =
        pokemon.name.charAt(0).toUpperCase() +
        pokemon.name.slice(1);

    list.innerHTML = "";


    // Render locations
    if (
        !pokemon.encounters ||
        pokemon.encounters.length === 0
    ) {

        list.innerHTML =
            "<p>No encounter information available.</p>";

    } else {

        pokemon.encounters.forEach(function(encounter) {

            const div = document.createElement("div");

            div.className = "location-entry";


            const versionText =
                Array.isArray(encounter.versions)

                    ? encounter.versions
                        .map(
                            version =>
                                VERSION_NAMES[version] ||
                                version
                        )
                        .join(", ")

                    : (
                        VERSION_NAMES[encounter.versions] ||
                        encounter.versions ||
                        "All Versions"
                    );


            const methodText =
                METHOD_NAMES[encounter.method] ||
                encounter.method ||
                "Standard";


            div.innerHTML = `
                <strong>${encounter.location}</strong>
                <br>
                <br>
                <span>Method: ${methodText}</span>
                <br>
                <br>
                <span>Version: ${versionText}</span>
            `;


            list.appendChild(div);

        });
    }


    modal.style.display = "flex";

    document.body.classList.add("modal-open");
}


// Close Modal
function closeLocation() {

    document.getElementById(
        "location-modal"
    ).style.display = "none";

    document.body.classList.remove(
        "modal-open"
    );
}


// Close when clicking modal backdrop
document
    .getElementById("location-modal")
    .addEventListener("click", function(event) {

        if (event.target === this) {
            closeLocation();
        }

    });


// ==============================
// Pokedex Progress
// ==============================

function updateProgress() {

    // Make sure POKEDEX_DATA exists
    if (typeof POKEDEX_DATA === "undefined") {

        console.error(
            "POKEDEX_DATA is missing."
        );

        return;
    }


    // ==============================
    // PALDEA
    // ==============================

    const paldea =
        POKEDEX_DATA.paldea || [];

    const paldeaCaught =
        paldea.filter(function(pokemon) {

            return caughtPokemon.includes(
                pokemon.name
            );

        }).length;

    const paldeaTotal =
        paldea.length;

    const paldeaPercentage =
        paldeaTotal === 0
            ? 0
            : Math.round(
                (paldeaCaught / paldeaTotal) * 100
            );


    document.getElementById(
        "paldea-progress-text"
    ).textContent =
        `${paldeaCaught} / ${paldeaTotal}`;


    document.getElementById(
        "paldea-progress-fill"
    ).style.width =
        `${paldeaPercentage}%`;


    // ==============================
    // DLC
    // ==============================

    const dlcOwned =
        localStorage.getItem(
            "dlcOwned"
        ) === "true";


    const dlcProgress =
        document.getElementById(
            "dlc-progress"
        );


    // If DLC isn't owned, hide DLC progress
    if (!dlcOwned) {

        dlcProgress.style.display =
            "none";

        return;
    }


    // DLC is owned
    dlcProgress.style.display =
        "block";


    // ==============================
    // TEAL MASK
    // ==============================

    const kitakami =
        POKEDEX_DATA.kitakami || [];


    const kitakamiCaught =
        kitakami.filter(function(pokemon) {

            return caughtPokemon.includes(
                pokemon.name
            );

        }).length;


    const kitakamiTotal =
        kitakami.length;


    const kitakamiPercentage =
        kitakamiTotal === 0
            ? 0
            : Math.round(
                (kitakamiCaught / kitakamiTotal) * 100
            );


    document.getElementById(
        "kitakami-progress-text"
    ).textContent =
        `${kitakamiCaught} / ${kitakamiTotal}`;


    document.getElementById(
        "kitakami-progress-fill"
    ).style.width =
        `${kitakamiPercentage}%`;


    // ==============================
    // INDIGO DISK
    // ==============================

    const blueberry =
        POKEDEX_DATA.blueberry || [];


    const blueberryCaught =
        blueberry.filter(function(pokemon) {

            return caughtPokemon.includes(
                pokemon.name
            );

        }).length;


    const blueberryTotal =
        blueberry.length;


    const blueberryPercentage =
        blueberryTotal === 0
            ? 0
            : Math.round(
                (blueberryCaught / blueberryTotal) * 100
            );


    document.getElementById(
        "blueberry-progress-text"
    ).textContent =
        `${blueberryCaught} / ${blueberryTotal}`;


    document.getElementById(
        "blueberry-progress-fill"
    ).style.width =
        `${blueberryPercentage}%`;
}


// ==============================
// Initial Progress Update
// ==============================

updateProgress();


// ==============================
// BACK TO TOP + SCROLL POSITION
// ==============================

const backToTopButton =
    document.getElementById("back-to-top");

let scrollingToTop = false;


// Show/hide Back to Top button
window.addEventListener("scroll", function() {

    // Don't save position while going to top
    if (!scrollingToTop) {

        localStorage.setItem(
            "scrollPosition",
            window.scrollY
        );

    }

    // Show button after scrolling 500px
    if (window.scrollY > 500) {

        backToTopButton.classList.add("show");

    } else {

        backToTopButton.classList.remove("show");

    }

});


// Restore scroll position when page loads
window.addEventListener("load", function() {

    const savedPosition =
        localStorage.getItem("scrollPosition");

    if (savedPosition !== null) {

        window.scrollTo(
            0,
            parseInt(savedPosition)
        );

    }

});


function scrollToTop() {

    // Stop saving scroll position
    scrollingToTop = true;

    // Remove the #teal-mask / #indigo-disk from the URL
    history.replaceState(
        null,
        "",
        window.location.pathname
    );

    // Save top position
    localStorage.setItem(
        "scrollPosition",
        "0"
    );

    // Go to top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    // Hide button
    backToTopButton.classList.remove("show");

    // Allow scroll position saving again
    setTimeout(function() {

        scrollingToTop = false;

        localStorage.setItem(
            "scrollPosition",
            "0"
        );

    }, 1000);
}


