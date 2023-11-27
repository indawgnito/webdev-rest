import * as path from "node:path";
import * as url from "node:url";

import { default as express } from "express";
import { default as sqlite3 } from "sqlite3";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const db_filename = path.join(__dirname, "db", "stpaul_crime.sqlite3");

const port = 8000;

let app = express();
app.use(express.json());

/********************************************************************
 ***   DATABASE FUNCTIONS                                         ***
 ********************************************************************/
// Open SQLite3 database (in read-write mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log("Error opening " + path.basename(db_filename));
    } else {
        console.log("Now connected to " + path.basename(db_filename));
    }
});

// Create Promise for SQLite3 database SELECT query
function dbSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Create Promise for SQLite3 database INSERT or DELETE query
function dbRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/********************************************************************
 ***   REST REQUEST HANDLERS                                      ***
 ********************************************************************/
// GET request handler for crime codes
app.get("/codes", (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let allCodes = dbSelect("SELECT * FROM Codes");
    // console.log(allCodes);
    Promise.all([allCodes]).then((results) => {
        console.log(results);
    });

    res.status(200).type("json").send({}); // <-- you will need to change this
});

// GET request handler for neighborhoods
app.get("/neighborhoods", (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let allNeighborhoods = dbSelect("SELECT * FROM Neighborhoods");

    Promise.all([allNeighborhoods]).then((results) => {
        console.log(results);
    });

    res.status(200).type("json").send({}); // <-- you will need to change this
});

// GET request handler for crime incidents
app.get("/incidents", (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let allIncidents = dbSelect("SELECT * FROM Incidents");

    Promise.all([allIncidents]).then((results) => {
        console.log(results);
    });

    res.status(200).type("json").send({}); // <-- you will need to change this
});

// PUT request handler for new crime incident
app.put("/new-incident", (req, res) => {
    console.log(req.body); // uploaded data

    res.status(200).type("txt").send("OK"); // <-- you may need to change this
});

// DELETE request handler for new crime incident
app.delete("/remove-incident", (req, res) => {
    console.log(req.body); // uploaded data

    res.status(200).type("txt").send("OK"); // <-- you may need to change this
});

/********************************************************************
 ***   START SERVER                                               ***
 ********************************************************************/
// Start server - listen for client connections
app.listen(port, () => {
    console.log("Now listening on port " + port);
});

// TO PUT
// curl -X PUT "http://localhost:8000/new-incident" -H "Content-Type: application/json" -d '{
//     "case_number": "19245020",
//     "date": "2019-10-30",
//     "time": "23:57:08",
//     "code": 9954,
//     "incident": "Proactive Police Visit",
//     "police_grid": 87,
//     "neighborhood_number": 7,
//     "block": "THOMAS AV  & VICTORIA"
//   }'

// TO DELETE
// curl -X DELETE "http://localhost:8000/remove-incident" -H "Content-Type: application/json" -d '{"case_number": "19245020"}'
