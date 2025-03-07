// Aggiungi questa riga all'inizio del tuo file script.js
let timeoutId = null;

// Aggiungi questo codice all'inizio del tuo file
document.addEventListener('DOMContentLoaded', function() {
    cleanupTimeouts(); // Pulisci eventuali timeout residui
    
    // Aggiungi questo per pulire i timeout quando cambi pagina
    window.addEventListener('beforeunload', cleanupTimeouts);
});

// Definizione di `query`, se non è già definita
let query = new URLSearchParams(window.location.search).get("q") || "";

document.addEventListener("DOMContentLoaded", function () {
    // Controlla se siamo nella pagina con il risultato della ricerca
    let searchQueryEl = document.getElementById("search-query");

    // Se l'elemento esiste, aggiorna il contenuto
    if (searchQueryEl) {
        let query = new URLSearchParams(window.location.search).get("q") || "Nessuna query";
        searchQueryEl.textContent = query;
    }
});


// Array statico delle pagine del sito con i loro titoli
const sitePages = ["Homepage", "Neon Genesis Evangelion (anime)",
    "Sinossi degli Episodi", "Episodio 01", "Episodio 02", "Episodio 03", "Episodio 04", "Episodio 05",
    "Episodio 06", "Episodio 07", "Episodio 08", "Episodio 09", "Episodio 10",
    "Episodio 11", "Episodio 12", "Episodio 13", "Episodio 14", "Episodio 15",
    "Episodio 16", "Episodio 17", "Episodio 18", "Episodio 19", "Episodio 20",
    "Episodio 21", "Episodio 22", "Episodio 23", "Episodio 24", "Episodio 25", "Episodio 26",
    "Eventi", "Cronologia", "Esperimento di Contatto", "First Impact", "Second Impact",
    "Luoghi", "Antartide", "Appartamento di Misato", "Central Dogma", "Centro di Comando",
    "Europa", "Geofront", "Germania", "Giappone", "Impianto Dummy plug",
    "Laboratorio di Evoluzione Artificiale", "Quartier Generale della Nerv", "Old-Tokyo", "Stati Uniti", "Terminal Dogma",
    "Tokyo-2", "Tokyo-3",
    "Personaggi", "Arael", "Armisael", "Bardiel", "Gaghiel",
    "Ireul", "Israfel", "Kaworu Nagisa", "Leliel", "Matarael",
    "Ramiel", "Sachiel", "Sahaquiel", "Sandalphon", "Shamsel",
    "Zeruel",
    "Unità EVA-00", "Unità EVA-01", "Unità EVA-02", "Unità EVA-03", "Unità EVA-04",
    "Kyoko Zeppelin Sohryu", "Naoko Akagi", "Yui Ikari",
    "Gendo Ikari", "Kōzō Fuyutsuki", "Makoto Hyuga", "Maya Ibuki", "Misato Katsuragi",
    "Ritsuko Akagi", "Ryoji Kaji", "Shigeru Aoba",
    "Asuka Soryu Langley", "Rei Ayanami", "Shinji Ikari", "Toji Suzuhara",
    "Adam", "Dr. Katsuragi", "Hikari Horaki", "Keel Lorenz", "Kensuke Aida",
    "Lilith", "Mr. Langley", "Pen Pen", "Shiro Tokita",
    "Tecnologia", "Aereo da Trasporto Speciale a Lungo Raggio per EVA", "Armi degli Evangelion", "Bachelite", "Caccia Pesante a Decollo Verticale delle Nazioni Unite",
    "Corpi di Simulazione", "Dummy System", "Entry Plug", "Equipaggiamento degli Evangelion", "Evangelion",
    "Fonti di Energia degli Evangelion", "Interface Headset", "Jet Alone", "LCL", "Magi System",
    "Plugsuit", "Tecnologia N²",
    "Terminologia", "Ali di Luce", "Angelo", "Anima", "A.T. Field",
    "Biologia Metafisica", "Comitato di Perfezionamento dell' Uomo", "Prima Razza Ancestrale", "Gehirn", "Guf",
    "Istituto Marduk", "JSSDF", "Lancia di Longinus", "Lilin", "Luna Bianca",
    "Luna Nera", "Mare di Dirac", "Materia d'Onda Particellare", "Modalità Berserk", "Motore s²",
    "Nazioni Unite", "NERV", "Nucleo", "Pattern", "Pergamene del Mar Morto",
    "Piano di Perfezionamento dell' Uomo", "Polysome", "Progetto E", "Prototipi di Evangelion Falliti", "Recupero",
    "SEELE", "Semi della Vita", "Sincronizzazione"];
const sitePagesLower = sitePages.map(page => page.toLowerCase());


function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        query: params.get("q") || "",
        results: JSON.parse(decodeURIComponent(params.get("results") || "[]")),
        correctedQuery: params.get("corrected") || ""
    };
}

// Funzione per calcolare la distanza di Levenshtein
function levenshteinDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }

    return dp[a.length][b.length];
}

// Funzione per evidenziare solo parole intere
function highlightMatch(text, matchedWord) {
    if (!matchedWord || matchedWord.length < 2) return text; // Evita parole troppo corte

    // Protegge il regex da caratteri speciali
    const safeWord = matchedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Regex che evidenzia solo parole intere
    const regex = new RegExp(`\\b${safeWord}\\b`, "gi");

    return text.replace(regex, '<span class="highlight">$&</span>');
}

// Funzione per trovare la parola più simile alla query ed evidenziarla nel testo
function extractHighlightedSnippet(text, query) {
    if (!text || !query) return text;

    const queryLower = query.toLowerCase();

    // Estrai solo parole vere dal testo
    const words = text.match(/\b\w+\b/g) || [];
    let bestMatch = "";
    let bestSimilarity = 0;

    words.forEach(word => {
        if (word.length < 3) return; // Evitiamo parole troppo corte
        const similarity = 1 - levenshteinDistance(queryLower, word.toLowerCase()) / Math.max(word.length, queryLower.length);
        if (similarity > bestSimilarity && similarity > 0.6) { // Aggiunto limite per evitare match deboli
            bestMatch = word;
            bestSimilarity = similarity;
        }
    });

    // Se la parola trovata è troppo diversa, non evidenziamo nulla
    if (!bestMatch) return text;

    return highlightMatch(text, bestMatch);
}

// Oggetto per mappare i titoli delle pagine ai loro percorsi relativi
const pagePaths = {
    "Sinossi degli Episodi": "homepage/episodi/episodi.html", "Episodio 01": "homepage/episodi/ep01.html", "Episodio 02": "homepage/episodi/ep02.html",
    "Episodio 03": "homepage/episodi/ep03.html", "Episodio 04": "homepage/episodi/ep04.html", "Episodio 05": "homepage/episodi/ep05.html",
    "Episodio 06": "homepage/episodi/ep06.html", "Episodio 07": "homepage/episodi/ep07.html", "Episodio 08": "homepage/episodi/ep08.html",
    "Episodio 09": "homepage/episodi/ep09.html", "Episodio 10": "homepage/episodi/ep10.html", "Episodio 11": "homepage/episodi/ep11.html",
    "Episodio 12": "homepage/episodi/ep12.html", "Episodio 13": "homepage/episodi/ep13.html", "Episodio 14": "homepage/episodi/ep14.html",
    "Episodio 15": "homepage/episodi/ep15.html", "Episodio 16": "homepage/episodi/ep16.html", "Episodio 17": "homepage/episodi/ep17.html",
    "Episodio 18": "homepage/episodi/ep18.html", "Episodio 19": "homepage/episodi/ep19.html", "Episodio 20": "homepage/episodi/ep20.html",
    "Episodio 21": "homepage/episodi/ep21.html", "Episodio 22": "homepage/episodi/ep22.html", "Episodio 23": "homepage/episodi/ep23.html",
    "Episodio 24": "homepage/episodi/ep24.html", "Episodio 25": "homepage/episodi/ep25.html", "Episodio 26": "homepage/episodi/ep26.html",
    "Eventi": "homepage/eventi/eventi.html", "Cronologia": "homepage/eventi/cronologia.html", "Esperimento di Contatto": "homepage/eventi/esperimento_contatto.html",
    "First Impact": "homepage/eventi/first_impact.html", "Second Impact": "homepage/eventi/second_impact.html",
    "Luoghi": "homepage/luoghi/luoghi.html", "Antartide": "homepage/luoghi/antartide.html", "Appartamento di Misato": "homepage/luoghi/appartamento_misato.html",
    "Central Dogma": "homepage/luoghi/central_dogma.html", "Centro di Comando": "homepage/luoghi/centro_comando.html", "Europa": "homepage/luoghi/europa.html",
    "Geofront": "homepage/luoghi/geofront.html", "Germania": "homepage/luoghi/germania.html", "Giappone": "homepage/luoghi/giappone.html",
    "Impianto Dummy Plug": "homepage/luoghi/impianto_dummy.html", "Laboratorio di Evoluzione Artificiale": "homepage/luoghi/laboratorio_evoluzione.html", "quartier Generale della Nerv": "homepage/luoghi/nerv_qg.html",
    "Old-Tokyo": "homepage/luoghi/old-tokyo.html", "Stati Uniti": "homepage/luoghi/stati_uniti.html", "Terminal Dogma": "homepage/luoghi/terminal_dogma.html",
    "Tokyo-2": "homepage/luoghi/tokyo-2.html", "Tokyo-3": "homepage/luoghi/tokyo-3.html",
    "Personaggi": "homepage/personaggi/personaggi.html", "Arael": "homepage/personaggi/angeli/arael.html", "Armisael": "homepage/personaggi/angeli/armisael.html",
    "Bardiel": "homepage/personaggi/angeli/bardiel.html", "Gaghiel": "homepage/personaggi/angeli/gaghiel.html", "Ireul": "homepage/personaggi/angeli/ireul.html",
    "Israfel": "homepage/personaggi/angeli/israfel.html", "Kaworu Nagisa": "homepage/personaggi/angeli/kaworu_nagisa.html", "Leliel": "homepage/personaggi/angeli/leliel.html",
    "Matarael": "homepage/personaggi/angeli/matarael.html", "Ramiel": "homepage/personaggi/angeli/ramiel.html", "Sachiel": "homepage/personaggi/angeli/sachiel.html",
    "Sahaquiel": "homepage/personaggi/angeli/sahaquiel.html", "Sandalphon": "homepage/personaggi/angeli/sandalphon.html", "Shamshel": "homepage/personaggi/angeli/shamshel.html",
    "Zeruel": "homepage/personaggi/angeli/zeruel.html",
    "Unità EVA-00": "homepage/personaggi/eva/eva00.html", "Unità EVA-01": "homepage/personaggi/eva/eva01.html", "Unità EVA-02": "homepage/personaggi/eva/eva02.html",
    "Unità EVA-03": "homepage/personaggi/eva/eva03.html", "Unità EVA-04": "homepage/personaggi/eva/eva04.html",
    "Unità EVA-00": "homepage/personaggi/eva/eva00.html",
    "Kyoko Zeppelin Sohryu": "homepage/personaggi/personale_gehirn/kyoko.html", "Naoko Akagi": "homepage/personaggi/personale_gehirn/naoko.html", "Yui Ikari": "homepage/personaggi/personale_gehirn/yui.html",
    "Kyoko Zeppelin Sohryu": "homepage/personaggi/personale_gehirn/kyoko.html",
    "Gendo Ikari": "homepage/personaggi/personale_nerv/gendo.html", "Kōzō Fuyutsuki": "homepage/personaggi/personale_nerv/kozo.html", "Makoto Hyuga": "homepage/personaggi/personale_nerv/makoto.html",
    "Maya Ibuki": "homepage/personaggi/personale_nerv/maya.html", "Misato Katsuragi": "homepage/personaggi/personale_nerv/misato.html", "Ritsuko Akagi": "homepage/personaggi/personale_nerv/ritsuko.html",
    "Ryoji Kaji": "homepage/personaggi/personale_nerv/kaji.html", "Shigeru Aoba": "homepage/personaggi/personale_nerv/shigeru.html",
    "Asuka Soryu Langley": "homepage/personaggi/piloti/asuka.html", "Rei Ayanami": "homepage/personaggi/piloti/rei.html", "Shinji Ikari": "homepage/personaggi/piloti/shinji.html",
    "Toji Suzuhara": "homepage/personaggi/piloti/toji.html",
    "Adam": "homepage/personaggi/vari/adam.html", "Dr.Katsuragi": "homepage/personaggi/vari/dr.katsuragi.html", "Hikari Horaki": "homepage/personaggi/vari/hikari.html",
    "Keel": "homepage/personaggi/vari/keel.html", "Kensuke": "homepage/personaggi/vari/kensuke.html", "Lilith": "homepage/personaggi/vari/lilith.html",
    "Mr.Langley": "homepage/personaggi/vari/mr.langley.html", "Pen Pen": "homepage/personaggi/vari/pen_pen.html", "Shiro Tokita": "homepage/personaggi/vari/shiro.html",
    "Tecnologia": "homepage/tecnologia/tecnologia.html", "Aereo da Trasporto Speciale a Lungo Raggio per EVA": "homepage/tecnologia/aereo_trasporto.html", "Armi degli Evangelion": "homepage/tecnologia/armi.html",
    "Bachelite": "homepage/tecnologia/bachelite.html", "Caccia Pesante a Decollo Verticale delle Nazioni Unite": "homepage/tecnologia/caccia_pesante.html", "Corpi di Simulazione": "homepage/tecnologia/corpi_simulazione.html",
    "Dummy System": "homepage/tecnologia/dummy.html", "Entry Plug": "homepage/tecnologia/entry.html", "Equipaggiamento degli Evangelion": "homepage/tecnologia/equipaggiamento.html",
    "Evangelion": "homepage/tecnologia/evangelion.html", "Fonti di Energia degli Evangelion": "homepage/tecnologia/fonti_energia.html", "Interface Headset": "homepage/tecnologia/headset.html",
    "Jet Alone": "homepage/tecnologia/jet.html", "LCL": "homepage/tecnologia/lcl.html", "Magi System": "homepage/tecnologia/magi.html",
    "Plugsuit": "homepage/tecnologia/plugsuit.html", "Tecnologia N²": "homepage/tecnologia/tecnologia_n2.html",
    "Terminologia": "homepage/terminologia/terminologia.html", "Ali di Luce": "homepage/terminologia/ali_di_luce.html", "Angelo": "homepage/terminologia/angelo.html",
    "Anima": "homepage/terminologia/anima.html", "A.T. Field": "homepage/terminologia/at_field.html", "Biologia Metafisica": "homepage/terminologia/biologia_metafisica.html",
    "Comitato di Perfezionamento dell' Uomo": "homepage/terminologia/comitato_perfezionamento.html", "Prima Razza Ancestrale": "homepage/terminologia/far.html", "Gehirn": "homepage/terminologia/gehirn.html",
    "Guf": "homepage/terminologia/guf.html", "Istituto Marduk": "homepage/terminologia/istituto_marduk.html", "JSSDF": "homepage/terminologia/jssdf.html",
    "lancia di Longinus": "homepage/terminologia/lancia_longinus.html", "Lilin": "homepage/terminologia/lilin.html", "Luna Bianca": "homepage/terminologia/luna_bianca.html",
    "Luna Nera": "homepage/terminologia/luna_nera.html", "Mare di Dirac": "homepage/terminologia/mare_dirac.html", "Materia d'Onda Particellare": "homepage/terminologia/materia_onda_particellare.html",
    "Modalità Berserk": "homepage/terminologia/modalità_berserk.html", "Motore S²": "homepage/terminologia/motore_s2.html", "Nazioni Unite": "homepage/terminologia/nazioni_unite.html",
    "NERV": "homepage/terminologia/nerv.html", "Nucleo": "homepage/terminologia/nucleo.html", "Pattern": "homepage/terminologia/pattern.html",
    "Pattern": "homepage/terminologia/pattern.html", "Pergamene del Mar Morto": "homepage/terminologia/pergamene.html", "Piano di Perfezionamento dell' Uomo": "homepage/terminologia/piano_perfezionamento.html",
    "Polysome": "homepage/terminologia/polysome.html", "Progetto E": "homepage/terminologia/progetto_e.html", "Prototipi di Evangelion Falliti": "homepage/terminologia/prototipi_evangelion.html",
    "Recupero": "homepage/terminologia/recupero.html", "SEELE": "homepage/terminologia/seele.html", "Semi della Vita": "homepage/terminologia/semi_vita.html",
    "Sincronizzazione": "homepage/terminologia/sincronizzazione.html"
};

// Funzione per mostrare i risultati con evidenziazione
function displayResults() {
    const { query, results, correctedQuery } = getQueryParams();
    let searchQueryEl = document.getElementById("search-query");
    if (searchQueryEl) {
        searchQueryEl.textContent = query || "Nessuna query";
    }
    let resultsList = document.getElementById("results-list");
    let correctedQueryDiv = document.getElementById("corrected-query");
    let correctedLink = document.getElementById("corrected-link");

    if (correctedLink && correctedQueryDiv) {
        if (correctedQuery && correctedQuery !== query) {
            correctedQueryDiv.style.display = "block";

            // Trova il nome completo del personaggio
            const correctQuery = sitePages.find(page =>
                page.toLowerCase().includes(correctedQuery.toLowerCase())
            );

            if (correctQuery) {
                correctedLink.textContent = correctQuery;
                const characterPath = pagePaths[correctQuery];

                // Pulisci il percorso rimuovendo eventuali duplicati
                let cleanPath = characterPath;
                if (cleanPath.startsWith('/homepage/')) {
                    cleanPath = cleanPath.replace('/homepage/', '/');
                }
                if (cleanPath.startsWith('/homepage')) {
                    cleanPath = cleanPath.replace('/homepage', '');
                }

                // Aggiungi il prefisso se non inizia con '/'
                if (!cleanPath.startsWith('/')) {
                    cleanPath = '/' + cleanPath;
                }

                if (cleanPath) {
                    correctedLink.href = cleanPath;
                    correctedLink.addEventListener("click", function (event) {
                        event.preventDefault();
                        window.location.href = cleanPath;
                    });
                } else {
                    correctedLink.href = "#";
                }
            } else {
                correctedQueryDiv.style.display = "none";
            }
        } else {
            correctedQueryDiv.style.display = "none";
        }
    }

    if (!resultsList) return; // Se `results-list` non esiste, esci dalla funzione

    if (!results || results.length === 0) {
        resultsList.innerHTML = `<p class="no-results">Nessun risultato trovato per "<strong>${query}</strong>"</p>`;
        return;
    }

    resultsList.innerHTML = results.map(result => {
        const title = result.title || "Pagina sconosciuta";
        const path = result.path || "#";
        const snippet = extractHighlightedSnippet(result.snippet || "Esempio di contenuto della pagina...", query);

        return `
            <div class="result-item">
                <a href="${path.startsWith('/') ? path : '/' + path}">${highlightMatch(title, query, title)}</a>
                <p class="result-snippet">...${snippet}...</p>
            </div>
        `;
    }).join("");
}

// Array per memorizzare le ricerche recenti
let recentSearches = [];

// Recupera le ricerche recenti dal localStorage
function loadRecentSearches() {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
        recentSearches = JSON.parse(savedSearches);
    }
}

// Salva le ricerche recenti nel localStorage (massimo 3 elementi)
function saveRecentSearches() {
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches.slice(0, 3)));
}

function updateRecentSearches() {
    const recentSearchesContainer = document.getElementById("suggestions-box");

    if (!recentSearchesContainer) return;

    let htmlContent = recentSearches.length === 0
        ? `<div class="recent-title"><strong>Ricerche recenti</strong></div><div class="recent-item" style="color: #aaa;">Nessuna ricerca recente</div>`
        : `<div class="recent-title"><strong>Ricerche recenti</strong></div>` +
        recentSearches.map((search, index) =>
            `<div class="recent-item" data-item="${search}">${search}<button class="remove-recent" data-index="${index}">X</button></div>`
        ).join("");

    recentSearchesContainer.innerHTML = htmlContent;
    attachRecentSearchClickEvents(); // Assicura che i pulsanti di rimozione funzionino
}

function attachRecentSearchClickEvents() {
    document.querySelectorAll(".suggestion-item, .recent-item").forEach(item => {
        item.addEventListener("click", function (event) {
            if (event.target.classList.contains("remove-recent")) return;
            const pageTitle = this.getAttribute("data-item");

            // Salva la ricerca nei recenti se è un suggerimento
            if (item.classList.contains("suggestion-item")) {
                if (!recentSearches.includes(pageTitle)) {
                    recentSearches.unshift(pageTitle);
                    recentSearches = recentSearches.slice(0, 3);
                    saveRecentSearches();
                }
            }

            if (pagePaths[pageTitle]) {
                window.location.href = `/${pagePaths[pageTitle]}`;
            } else {
                handleSearch(pageTitle);
            }
        });
    });

    document.querySelectorAll(".remove-recent").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const index = this.getAttribute("data-index");
            recentSearches.splice(index, 1);
            saveRecentSearches();
            updateRecentSearches();
        });
    });
}

// Carica le ricerche recenti all'avvio dello script
loadRecentSearches();

// Imposta i margini del contenitore principale in base alla larghezza del menu
let menuWrapper = document.querySelector(".navMenu-wrapper");
let mainContent = document.querySelector(".mainContent");
if (menuWrapper && mainContent) {
    let menuWidth = menuWrapper.offsetWidth;
    mainContent.style.marginLeft = (menuWidth + 25) + "px";
}

const searchInput = document.getElementById("searchInput");

if (searchInput) {
    searchInput.addEventListener("focus", () => {
        searchInput.setAttribute("data-placeholder", searchInput.getAttribute("placeholder"));
        searchInput.setAttribute("placeholder", "");

        if (searchInput.value.trim() === "") {
            updateSuggestionsBox("");
        }
    });

    searchInput.addEventListener("blur", () => {
        searchInput.setAttribute("placeholder", searchInput.getAttribute("data-placeholder"));
    });

  // Modifica l'evento input per gestire meglio i timeout
searchInput.addEventListener("input", function() {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
        updateSuggestionsBox(searchInput.value.toLowerCase());
    }, 150);
});

    // Aggiungi questa funzione per pulire i timeout quando cambi pagina
function cleanupTimeouts() {
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
}


const suggestionsBox = document.getElementById("suggestions-box");

function updateSuggestionsBox(query) {
    let htmlContent = "";
    if (query.length === 0) {
        htmlContent = "<div style='color: #aaa;'>Inizia a digitare per vedere i suggerimenti...</div>";
    } else {
        const filteredPages = fuzzySearch(query, sitePages);
        if (filteredPages.length > 0) {
            const bestMatch = filteredPages[0];
            htmlContent += `<div class="suggestion-highlight" data-item="${bestMatch}">${bestMatch}</div>`;
            filteredPages.slice(1).forEach(page => {
                htmlContent += `<div class="suggestion-item" data-item="${page}">${page}</div>`;
            });
        } else {
            // Mostra suggerimenti più generici se non ci sono risultati esatti
            const partialMatches = sitePages.filter(page => 
                page.toLowerCase().includes(query.toLowerCase())
            );
            if (partialMatches.length > 0) {
                htmlContent = "<div style='color: #666;'>Risultati parziali:</div>";
                partialMatches.forEach(page => {
                    htmlContent += `<div class="suggestion-item" data-item="${page}">${page}</div>`;
                });
            } else {
                htmlContent = "<div style='color: #aaa;'>Nessun risultato trovato</div>";
            }
        }
    }
    suggestionsBox.innerHTML = htmlContent;
    suggestionsBox.style.display = htmlContent ? "block" : "none";
}

function soundex(s) {
    const codes = {
        a: "", e: "", i: "", o: "", u: "", y: "", h: "", w: "",
        b: "1", f: "1", p: "1", v: "1",
        c: "2", g: "2", j: "2", k: "2", q: "2", s: "2", x: "2", z: "2",
        d: "3", t: "3",
        l: "4",
        m: "5", n: "5",
        r: "6"
    };

    s = s.toLowerCase().replace(/[^a-z]/g, ""); // Rimuove caratteri non alfabetici
    if (s.length === 0) return "";

    let result = s[0].toUpperCase(); // Mantiene la prima lettera
    let prevCode = codes[s[0]];

    for (let i = 1; i < s.length; i++) {
        let code = codes[s[i]];
        if (code !== prevCode) result += code;
        if (result.length === 4) break;
        prevCode = code;
    }

    return result.padEnd(4, "0"); // Completa con zeri se serve
}

function metaphone(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, ""); // Rimuove caratteri speciali

    return word
        .replace(/^kn|gn|pn|ae|wr/, '') // Elimina certe lettere iniziali mute
        .replace(/mb$/, 'm') // "mb" finale diventa "m"
        .replace(/cq/g, 'k')
        .replace(/ci|ce|cy/g, 's')
        .replace(/ch/g, 'x') // "ch" diventa "x" (simile a 'sh')
        .replace(/c/g, 'k')
        .replace(/dg/g, 'j')
        .replace(/tch/g, 'ch')
        .replace(/d/g, 't')
        .replace(/ph/g, 'f')
        .replace(/q/g, 'k')
        .replace(/x/g, 'ks')
        .replace(/z/g, 's')
        .replace(/v/g, 'f')
        .replace(/wh/g, 'w')
        .replace(/w([^aeiou])/g, '$1') // Rimuove 'w' se seguita da consonante
        .replace(/^h([^aeiou])/g, '$1') // Rimuove 'h' iniziale se seguita da consonante
        .replace(/(.)\1+/g, '$1'); // Rimuove lettere doppie
}

function fuzzySearch(query, items) {
    if (!query) return [];
    
    const queryLower = query.toLowerCase();
    
    // Calcola la similarità con un algoritmo più permissivo
    return items
        .map(item => {
            const itemLower = item.toLowerCase();
            const similarity = 1 - levenshteinDistance(queryLower, itemLower) / 
                             Math.max(itemLower.length, queryLower.length);
            
            // Aggiungi bonus per corrispondenze parziali
            const partialMatch = itemLower.includes(queryLower);
            const similarityBonus = partialMatch ? 0.3 : 0;
            
            return {
                item,
                similarity: similarity + similarityBonus
            };
        })
        .filter(entry => entry.similarity >= 0.4) // Soglia più bassa
        .sort((a, b) => b.similarity - a.similarity)
        .map(entry => entry.item);
}

async function extractSnippetFromPage(path, query) {
    try {
        const response = await fetch(`/${path}`);
        if (!response.ok) throw new Error(`Errore: ${response.statusText}`);
        const text = await response.text();

        // Pulizia del testo rimuovendo HTML e spazi superflui
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanText.split(/\s+/); // Divide il testo in parole

        // Trova la parola più simile alla query usando Levenshtein
        const bestMatch = words.reduce((closest, word) => {
            const distance = levenshteinDistance(query.toLowerCase(), word.toLowerCase());
            return distance < closest.distance ? { word, distance } : closest;
        }, { word: null, distance: Infinity });

        // Se nessuna parola ha una distanza accettabile, usa direttamente il miglior suggerimento della ricerca
        if (!bestMatch.word || bestMatch.distance > 3) {
            bestMatch.word = fuzzySearch(query, sitePages)[0] || query;
        }

        // Ora cerca la parola migliore nel testo della pagina
        const regex = new RegExp(bestMatch.word, "i");
        const match = cleanText.match(regex);
        const index = match ? match.index : -1;

        // Se trova una parola abbastanza simile, crea lo snippet attorno ad essa
        if (bestMatch.word && bestMatch.distance <= 3) {
            const regex = new RegExp(bestMatch.word, "i"); // Crea una regex case-insensitive
            const match = cleanText.match(regex);

            const index = match ? match.index : -1;
            const snippetStart = Math.max(0, index - 50);
            const snippetEnd = Math.min(cleanText.length, index + 50);

            return `...${cleanText.substring(snippetStart, index)}<strong>${bestMatch.word}</strong>${cleanText.substring(index + bestMatch.word.length, snippetEnd)}...`;
        }

        // Se nessuna parola è abbastanza simile, restituisce un estratto generico
        return cleanText.length > 100 ? `...${cleanText.substring(0, 100)}...` : cleanText;

    } catch (error) {
        console.error("Errore:", error);
        return "Nessun contenuto disponibile";
    }
}

// Modifica la funzione handleSearch per includere la pulizia
async function handleSearch(query) {
    cleanupTimeouts(); // Pulisci i timeout all'inizio
    query = query.trim();
    if (!query) return;
    
    if (!recentSearches.includes(query)) {
        recentSearches.unshift(query);
        recentSearches = recentSearches.slice(0, 3);
        saveRecentSearches();
        updateRecentSearches();
    }
    
    let suggestions = fuzzySearch(query, sitePages);
    let bestMatch = suggestions.length > 0 ? suggestions[0] : null;
    let finalResults = suggestions.slice(0, 4);
    
    const correctedQuery = bestMatch && 
        bestMatch.toLowerCase() !== query.toLowerCase() ? bestMatch : null;
    
    if (finalResults.length < 4) {
        finalResults = finalResults.concat(
            sitePages.filter(page => !finalResults.includes(page))
                .slice(0, 4 - finalResults.length)
        );
    }
    
    const resultsWithSnippets = await Promise.all(finalResults.map(async page => {
        const path = pagePaths[page];
        return {
            title: page,
            path: path || "#",
            snippet: path ? await extractSnippetFromPage(path, correctedQuery || query) : "Nessun contenuto disponibile"
        };
    }));
    
    window.location.href = `/homepage/risultati.html?q=${encodeURIComponent(query)}&results=${encodeURIComponent(JSON.stringify(resultsWithSnippets))}${correctedQuery ? `&corrected=${encodeURIComponent(correctedQuery)}` : ''}`;
}

function handleCorrectedSearch(correctedQuery) {
    document.getElementById("searchInput").value = correctedQuery;
    handleSearch(correctedQuery);
}

document.getElementById("searchForm").addEventListener("submit", function (event) {
    event.preventDefault();
    handleSearch(searchInput.value.trim());
});

document.addEventListener("click", function (event) {
    const suggestionsBox = document.getElementById("suggestions-box");
    const searchInput = document.getElementById("searchInput");

    if (!suggestionsBox.contains(event.target) && event.target !== searchInput) {
        suggestionsBox.style.display = "none";
    }
});

    function hideSuggestions(event) {
    const suggestionsBox = document.getElementById("suggestions-box");
    const searchInput = document.getElementById("searchInput");

    if (suggestionsBox && searchInput) {
        if (!suggestionsBox.contains(event.target) && event.target !== searchInput) {
            suggestionsBox.style.display = "none";
        }
    }
}

document.addEventListener("click", hideSuggestions);

// Riprova a collegare l'evento se l'elemento viene creato dinamicamente
const observer = new MutationObserver(() => {
    if (document.getElementById("suggestions-box")) {
        document.addEventListener("click", hideSuggestions);
        observer.disconnect(); // Interrompe l'osservazione una volta che l'elemento è trovato
    }
});

observer.observe(document.body, { childList: true, subtree: true });

    
displayResults();



