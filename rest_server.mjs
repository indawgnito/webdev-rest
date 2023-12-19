import * as path from "node:path";
import * as url from "node:url";

import { default as express } from "express";
import { default as sqlite3 } from "sqlite3";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const db_filename = path.join(__dirname, "db", "stpaul_crime.sqlite3");

const port = 8000;

let app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

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

  let sql = "SELECT * from Incidents";
  let params = [];

  if (req.query.code) {
    let code = req.query.code;
    sql += " WHERE ";

    if (code.includes(",")) {
      // split the codes by comma
      let codes = code.split(",");
      sql += "(";

      // create a query for each code
      codes.forEach((code, index, array) => {
        if (index !== array.length - 1) {
          sql += "code = ? OR ";
          params.push(code);
        } else {
          sql += "code = ?";
          params.push(code);
        }
      });

      sql += ")";

      // if there is only one code
    } else {
      sql += "code = ?";
      params.push(code);
    }
  }

  if (req.query.neighborhood) {
    let neighborhood = req.query.neighborhood;

    if (params.length === 0) {
      sql += " WHERE ";
    } else {
      sql += " AND ";
    }

    if (neighborhood.includes(",")) {
      // split the codes by comma
      let neighborhoods = neighborhood.split(",");

      sql += "(";

      // create a query for each code
      neighborhoods.forEach((neighborhood, index, array) => {
        if (index !== array.length - 1) {
          sql += "neighborhood_number = ? OR ";
          params.push(neighborhood);
        } else {
          sql += "neighborhood_number = ?";
          params.push(neighborhood);
        }
      });

      sql += ")";

      // if there is only one code
    } else {
      sql += "neighborhood_number = ?";
      params.push(neighborhood);
    }
  }

  if (req.query.grid) {
    let grid = req.query.grid;

    if (params.length === 0) {
      sql += " WHERE ";
    } else {
      sql += " AND ";
    }

    if (grid.includes(",")) {
      // split the codes by comma
      let grids = grid.split(",");

      sql += "(";

      // create a query for each code
      grids.forEach((grid, index, array) => {
        if (index !== array.length - 1) {
          sql += "police_grid = ? OR ";
          params.push(grid);
        } else {
          sql += "police_grid = ?";
          params.push(grid);
        }
      });

      sql += ")";

      // if there is only one code
    } else {
      sql += "police_grid = ?";
      params.push(grid);
    }
  }

  sql += ` ORDER BY date_time DESC`;

  if (req.query.limit) {
    sql += ` LIMIT ${req.query.limit}`;
  } else {
    sql += " LIMIT 1000";
  }

  console.log(sql);
  console.log(params);

  dbSelect(sql, params)
    .then((results) => {
      // for each item in results, separate date_time property
      // into date and time properties
      results.forEach((item) => {
        let date_time = item.date_time.split("T");
        item.date = date_time[0];
        item.time = date_time[1];
        delete item.date_time;
      });

      // now that there is the date and time properties, sort by date.
      // this should work because of the existing datetime format

      // only grab items after start date, if there is one
      if (req.query.start_date) {
        let start_date = req.query.start_date;
        results = results.filter((item) => {
          return item.date >= start_date;
        });
      }

      // and before end date, if there is one
      if (req.query.end_date) {
        let end_date = req.query.end_date;
        results = results.filter((item) => {
          return item.date <= end_date;
        });
      }

      res.status(200).type("json").send(results);
    })
    .catch((error) => {
      res.status(500).type("txt").send(error);
    });
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
    "INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?,?,?,?,?,?,?)",
    [
      newIncident.case_number,
      `${newIncident.date}T${newIncident.time}`,
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
    .catch((error) => {
      console.log(error);
      res.status(500).type("txt").send(error);
    });

  // res.status(200).type("txt").send("OK"); // <-- you may need to change this
});

// DELETE request handler for new crime incident
app.delete("/remove-incident", (req, res) => {
  const incident = "SELECT * FROM Incidents WHERE case_number = ?";
  const deleteQ = "DELETE FROM Incidents WHERE case_number = ?";

  // get case number
  const caseNumber = req.body.case_number;

  dbSelect(incident, [caseNumber])
    .then((rows) => {
      if (rows.length === 0) {
        throw new Error("Case Number Not Found");
      } else {
        return dbRun(deleteQ, [caseNumber]);
      }
    })
    .then(() => {
      console.log(`${caseNumber} has been deleted`);
      res
        .status(200)
        .type("txt")
        .send(`Case number ${caseNumber} has been deleted.`);
    })
    .catch((error) => {
      console.error(error.message);
      res.status(500).type("txt").send(error.message);
    });
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
//this works: curl -X DELETE "http://localhost:8000/remove-incident" -H "Content-Type: application/json" -d "{\"case_number\": \"19245020\"}"
//case number ..... has been deleted
// and this works: curl -X DELETE "http://localhost:8000/remove-incident" -H "Content-Type: application/json" -d "{\"case_number\": \"19245014\"}"
//Case number 19245014 has been deleted.
//curl -X DELETE "http://localhost:8000/remove-incident" -H "Content-Type: application/json" -d "{\"case_number\": \"19245006\"}"
//Case number 19245006 has been deleted.
