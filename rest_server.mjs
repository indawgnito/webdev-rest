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

  // codes can be separates by comma
  // ex: http://localhost:8000/codes?code=100,207,301

  // if there is at least one code in the query
  if (req.query.code) {
    // store list of codes
    let code = req.query.code;

    // if there is more than one code
    if (code.includes(",")) {
      // split the codes by comma
      let codes = code.split(",");

      let queries = [];

      // create a query for each code
      codes.forEach((code) => {
        queries.push(dbSelect("SELECT * FROM Codes WHERE code = ?", code));
      });

      // run all queries
      Promise.all(queries)
        .then((results) => {
          // change from a list of lists to a list
          results = results.flat();

          res.status(200).type("json").send(results);
        })
        .catch((err) => {
          res.status(500).type("txt").send(err);
        });

      // if there is only one code
    } else {
      // run query
      code = dbSelect("SELECT * FROM Codes WHERE code = ?", code);

      code.then((results) => {
        res.status(200).type("json").send(results);
      });
    }
  } else {
    // send all the codes
    let allCodes = dbSelect("SELECT * FROM Codes");

    allCodes.then((results) => {
      res.status(200).type("json").send(results);
    });
  }
});

// GET request handler for neighborhoods
app.get("/neighborhoods", (req, res) => {
  console.log(req.query); // query object (key-value pairs after the ? in the url)

  // neighborhoods can be separates by comma
  // ex: http://localhost:8000/neighborhoods?id=1,2,3

  // if there is at least one neighborhood in the query
  if (req.query.id) {
    // store list of neighborhoods
    let id = req.query.id;

    // if there is more than one neighborhood
    if (id.includes(",")) {
      // split the neighborhoods by comma
      let ids = id.split(",");

      let queries = [];

      // create a query for each neighborhood
      ids.forEach((id) => {
        queries.push(
          dbSelect(
            "SELECT * FROM Neighborhoods WHERE neighborhood_number = ?",
            id
          )
        );
      });

      // run all queries
      Promise.all(queries)
        .then((results) => {
          // change from a list of lists to a list
          results = results.flat();

          res.status(200).type("json").send(results);
        })
        .catch((err) => {
          res.status(500).type("txt").send(err);
        });

      // if there is only one neighborhood in the query
    } else {
      // run query
      id = dbSelect(
        "SELECT * FROM Neighborhoods WHERE neighborhood_number = ?",
        id
      );

      id.then((results) => {
        res.status(200).type("json").send(results);
      });
    }
  } else {
    // send all the neighborhoods
    let allNeighborhoods = dbSelect("SELECT * FROM Neighborhoods");

    allNeighborhoods.then((results) => {
      res.status(200).type("json").send(results);
    });
  }
});

// GET request handler for crime incidents
app.get("/incidents", (req, res) => {
  console.log(req.query); // query object (key-value pairs after the ? in the url)


  
  if (req.query.code) {
    let code = req.query.code;

    if (code.includes(",")) {
      // split the codes by comma
      let codes = code.split(",");

      let queries = [];

      // create a query for each code
      codes.forEach((code) => {
        queries.push(dbSelect("SELECT * FROM Codes WHERE code = ?", code));
      });

      // run all queries
      Promise.all(queries)
        .then((results) => {
          // change from a list of lists to a list
          results = results.flat();

          res.status(200).type("json").send(results);
        })
        .catch((err) => {
          res.status(500).type("txt").send(err);
        });

      // if there is only one code
    } else {
      // run query
      code = dbSelect("SELECT * FROM Codes WHERE code = ?", code);

      code.then((results) => {
        res.status(200).type("json").send(results);
      });
    }
  }

  // let allIncidents = dbSelect("SELECT * FROM Incidents");

  // Promise.all([allIncidents]).then((results) => {
  //   results = results.flat();

  //   res.status(200).type("json").send(results);
  // });

  // res.status(200).type("json").send({}); // <-- you will need to change this
});

// PUT request handler for new crime incident
app.put("/new-incident", (req, res) => {
  console.log(req.body); // uploaded data
  let newIncident = req.body;
  let addedIncident = dbRun(
    "INSERT INTO Incidents (case_number, date, time, code, incident, police_grid, neighborhood_number, black) VALUES (?,?,?,?,?,?,?,?)",
    [
      newIncident.case_number,
      newIncident.data,
      newIncident.time,
      newIncident.code,
      newIncident.incident,
      newIncident.police_grid,
      newIncident.neighborhood_number,
      newIncident.block,
    ]
  );

  addedIncident
    .then(() => {
      res.status(200).type("txt").send("OK");
    })
    .catch(() => {
      res.status(500).type("txt").send("Case already exists in table");
    });

  // res.status(200).type("txt").send("OK"); // <-- you may need to change this
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
