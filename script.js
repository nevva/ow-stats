const originalOrder = ["Tracer", "Reaper", "Widowmaker", "Pharah", "Reinhardt", "Mercy", "Torbjörn", "Hanzo", "Winston", "Zenyatta", "Bastion", "Symmetra", "Zarya", "cassidy", "Soldier76", "Lúcio", "Roadhog", "Junkrat", "D.Va", "Mei", "Genji", "Ana", "Sombra", "Orisa", "Doomfist", "Moira", "Brigitte", "Wrecking_Ball", "ashe", "Baptiste", "Sigma", "Echo", "Sojourn", "Junker_Queen", "kiriko", "Ramattra", "Lifeweaver", "Illari", "Mauga", "Venture"];
const container = document.getElementById('container');

const sortButtonsRow = document.createElement('div');
sortButtonsRow.id = 'sort-buttons';
sortButtonsRow.classList.add('row');
const listContainer = document.createElement('div');
listContainer.id = 'characters-list';
const exportButton = document.createElement('button');
const exportAllTimestamps = document.createElement('button');

container.appendChild(sortButtonsRow);
container.appendChild(listContainer);
container.appendChild(exportButton);
container.appendChild(exportAllTimestamps);

document.addEventListener('DOMContentLoaded', () => {

    const originalOrderButton = document.createElement('button');
    originalOrderButton.textContent = 'Original Order';
    originalOrderButton.addEventListener('click', () => {
        renderCharacters(originalOrder);
    });

    const nameButton = document.createElement('button');
    nameButton.textContent = 'Name';
    nameButton.addEventListener('click', () => {
        const sortedCharacters = [...originalOrder].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        renderCharacters(sortedCharacters);
    });

    const totalCounterButton = document.createElement('button');
    totalCounterButton.textContent = 'Total Counter';
    totalCounterButton.addEventListener('click', () => {
        const sortedCharacters = [...originalOrder].sort((a, b) => {
            const countA = parseInt(localStorage.getItem(a) || '0', 10);
            const countB = parseInt(localStorage.getItem(b) || '0', 10);
            return countB - countA;
        });
        renderCharacters(sortedCharacters);
    });

    sortButtonsRow.appendChild(originalOrderButton);
    sortButtonsRow.appendChild(nameButton);
    sortButtonsRow.appendChild(totalCounterButton);

    renderCharacters(originalOrder);


    exportButton.textContent = 'Export as CSV';
    exportButton.onclick = exportAsCSV;
    exportAllTimestamps.textContent = 'Export All timestams as CSV';
    exportAllTimestamps.onclick = exportAllTimestampsAsCSV;

    loadIndexedDB();

    function exportAsCSV() {

        // Call the function to read all rows from IndexedDB
        let allDatumRows = readAllRowsFromIndexedDB();
        const csvContent = "data:text/csv;charset=utf-8," + originalOrder.map(character => {
            const count = localStorage.getItem(character) || 0;
            return `${character},${count}`;
        }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ow-stats.csv");
        document.body.appendChild(link);
        link.click();
    }
    function exportAllTimestampsAsCSV() {
        readAllRowsFromIndexedDB((allDatumRows) => {

            const csvContent = "data:text/csv;charset=utf-8," + allDatumRows.map(row => {
                return row;
            }).join(",\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "ow-timestamps.csv");
            document.body.appendChild(link);
            link.click();
        });
    }
});

function renderCharacters(characters) {
    listContainer.innerHTML = '';
    characters.forEach((character) => {
        const characterElement = document.createElement('div');
        characterElement.classList.add('character');

        const name = document.createElement('span');
        name.textContent = character;

        const minusButton = document.createElement('button');
        minusButton.textContent = '-';
        minusButton.onclick = () => adjustCounter(character, -1);

        const plusButton = document.createElement('button');
        plusButton.textContent = '+';
        plusButton.onclick = () => adjustCounter(character, 1);

        const counter = document.createElement('span');
        counter.id = `counter-${character}`;
        counter.textContent = localStorage.getItem(character) || 0;

        const row = document.createElement('div');
        row.classList.add('row');
        row.appendChild(minusButton);
        row.appendChild(counter);
        row.appendChild(plusButton);

        const characterImage = document.createElement('img');
        characterImage.src = `OverwatchIcons/Icon-${character}.png?${Date.now()}`;

        characterImage.addEventListener('click', () => {
            console.log('Easter egg!');
            const eastereggImageSrc = `OverwatchIcons/Icon-${character}-easteregg.png?${Date.now()}`;

            fetch(eastereggImageSrc)
                .then(response => {
                    if (response.ok) {
                        const eastereggImage = document.createElement('img');
                        eastereggImage.src = eastereggImageSrc;
                        characterImage.replaceWith(eastereggImage);
                    } else if (response.status === 404) {
                        // Handle 404 error here
                        console.log('Easter egg image not found');
                    }
                })
                .catch(error => {
                    console.error('Error fetching Easter egg image:', error);
                });
        });


        characterElement.appendChild(name);
        characterElement.appendChild(characterImage);
        characterElement.appendChild(row);
        listContainer.appendChild(characterElement);
    });

}

function adjustCounter(character, adjustment) {
    const currentCount = parseInt(localStorage.getItem(character) || '0', 10);
    const newCount = currentCount + adjustment;
    localStorage.setItem(character, newCount.toString());
    const counterElement = document.getElementById(`counter-${character}`);
    counterElement.textContent = newCount;

    const timestamp = new Date().toLocaleString();

    const transaction = db.transaction(['datum'], 'readwrite');
    const store = transaction.objectStore('datum');
    const datum = new Date().toISOString();

    store.add(`${character}|${adjustment}|${datum}`);

    transaction.oncomplete = function () {
        console.log('Datum tillagt:', datum);
        // Add the 'set-selected' class to the adjusted cell
        const parentRow = counterElement.closest('.character');
        parentRow.classList.add('set-selected');
        setTimeout(() => {
            parentRow.classList.remove('set-selected');
        }, 60000); // Remove the 'set-selected' class after one minute
    };

    transaction.onerror = function (event) {
        console.error('Transaction error:', event.target.error);
    };
}

let db;
function loadIndexedDB() {

    // Öppna en databas
    const request = indexedDB.open('DatumDatabas', 1);

    // Hantera databasuppdateringar
    request.onupgradeneeded = function (event) {
        db = event.target.result;

        // Skapa en object store om den inte redan finns
        if (!db.objectStoreNames.contains('datum')) {
            console.log("clearing local storage to match with indexedDB")
            localStorage.clear();
            db.createObjectStore('datum', { autoIncrement: true });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
    };

    request.onerror = function (event) {
        console.error('Database error: ', event.target.errorCode);
    };
}
function readAllRowsFromIndexedDB(callback) {
    if (db == null) {
        console.error('Database is not open yet');
        return;
    }
    const transaction = db.transaction(["datum"]);
    const objectStore = transaction.objectStore("datum");
    const request = objectStore.getAll();
    request.onerror = (event) => {
        // Handle errors!\
        console.error('Error reading all rows:', event.target.error);
    };
    request.onsuccess = (event) => {
        // Do something with the request.result!
        console.log('All rows:', request.result);
        callback(request.result);
    };
}

