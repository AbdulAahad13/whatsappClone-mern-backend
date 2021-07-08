//import

import express from 'express';
import mongoose from 'mongoose';
import Messages from "./dbMessages.js";
import Pusher from 'pusher';
import cors from "cors";
//app config

const app = express()
const port = process.env.PORT || 9000


const pusher = new Pusher({
    appId: "1232119",
    key: "0bbfcd33e5dabfc402d2",
    secret: "ade5a71fa6d9d6b4b1af",
    cluster: "ap2",
    useTLS: true
});

pusher.trigger("my-channel", "my-event", {
    message: "hello world"
});
//middleware
app.use(express.json());
app.use(cors());


const connection_url = 'mongodb+srv://admin:gQeZdH3818VG9FJs@cluster0.jisrn.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,

});

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A change occured", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted",
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                });
        } else {
            console.log("Error triggering pusher")
        }
    });
});

//api route
app.get('/', (req, res) => res.status(200).send('WHATSAPP CLONE SERVER ONLINE...AGAIN'))

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    });
});

//listner
app.listen(port, () => console.log(`listening on PORT ${port} `))




