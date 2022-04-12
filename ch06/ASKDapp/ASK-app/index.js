const express = require("express");
const fs = require("fs");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("src"));
app.use(express.static("../ASK-contract/build/contracts"));

app.get("/", function (req, res) {
    res.render("index.html");
});

app.get("/airlineFlights", function (req, res) {
    const contents = fs.readFileSync("db/ASKAvailSeats.json");
    const cursor = JSON.parse(contents);
    const airlineFlights = {};
    for (let index in cursor) {
        airlineFlights[cursor[index].FlightID] = cursor[index];
    }
    res.send(airlineFlights);
});

app.post("/updateSeats", function (req, res) {
    console.log("Inside index.js. Seat value: " + req.body.seats + " flight Id: " + req.body.flightId);
    const seats = parseInt(req.body.seats);
    const flightId = parseInt(req.body.flightId);
    const contents = fs.readFileSync("./db/ASKAvailSeats.json");
    // console.log("Index.js contents: " + contents);
    const cursor = JSON.parse(contents);
    // console.log("Index.js cursor: " + cursor);
    for (let index in cursor) {
        if (cursor[index].FlightID === flightId) {
            const newSeats = cursor[index].SeatsAvail - seats;
            cursor[index].SeatsAvail = newSeats;
            const data = JSON.stringify(cursor, null, 2);
            fs.writeFile("./db/ASKAvailSeats.json", data, (err) => {
                if (err) throw err;
                res.send({updatedSeats: newSeats});
            });
        }
    }
});

app.listen(3000, function () {
    console.log("Airline Consortium ASK Dapp listening on port 3000!");
});
