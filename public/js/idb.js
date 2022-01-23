// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `pending`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('pending', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    if (navigator.onLine) {
        checkDatabase();
    }
  };
  
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };

  // This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['pending'], 'readwrite');
  
    // access the object store for `new_pizza`
    const store = transaction.objectStore('pending');
  
    // add record to your store with add method
    store.add(record);
  }

  function checkDatabase() {
    // open a transaction on your db
    const transaction = db.transaction(['pending'], 'readwrite');

    // access your object store
    const store = transaction.objectStore('pending');

    // get all records from store and set to a variable
    const getAll = store.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(ServerResponse => {
                if (ServerResponse.message) {
                    throw new Error(ServerResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['pending'], 'readwrite');
                // access the new_pizza object store
                const store = transaction.objectStore('pending');
                // clear all items in your store
                store.clear();
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

window.addEventListener("online", checkDatabase);