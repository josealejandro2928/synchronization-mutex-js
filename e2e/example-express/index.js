/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');
const { WebSite, websitesSeed } = require('./model.js');
const { Mutex } = require("synchronization-mutex-js");

const mutex = new Mutex();
const UPDATE_VIEW_TOPIC = 'UPDATE_VIEW_TOPIC';
mutex.setMaxConcurrentTaskForTopic(UPDATE_VIEW_TOPIC, 1);

// Create an instance of the express application
const app = express();

// Enable CORS, body-parser, morgan, and helmet middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(helmet());


app.get('/websites', async (req, res) => {
  let websites = await getWebSites();
  res.json(websites);
});


const delayMs = (ms = 1000) => new Promise(res => setTimeout(res, ms));

async function getWebSites() {
  return new Promise((res, rej) => {
    fs.readFile("./websites.json", { encoding: "utf-8" }, (err, data) => {
      if (err) {
        return rej(err);
      }
      return res(JSON.parse(data));

    })
  })

}

app.post('/websites', async (req, res) => {
  const { name, description } = req.body;
  const website = new WebSite(name, description);
  let websites = await getWebSites();
  websites.push(website);
  fs.writeFile('./websites.json', JSON.stringify(websites), (err) => {
    if (err) {
      return res.status(404).send('The website with the given ID was not found.');
    } else {
      res.json(website);
    }
  })
});

app.get('/websites/:id', async (req, res) => {
  let websites = await getWebSites();
  const website = websites.find(w => w.id === parseInt(req.params.id));
  if (!website) {
    return res.status(404).send('The website with the given ID was not found.');
  }
  res.json(website);
});

app.get('/websites/:id/view', async (req, res) => {
  let websites = await getWebSites();
  const website = websites.find(w => w.id === parseInt(req.params.id))
  if (!website) {
    return res.status(404).send('The website with the given ID was not found.');
  }
  website.visits++;
  fs.writeFile('./websites.json', JSON.stringify(websites), (err) => {
    if (err) {
      return res.status(404).send('The website with the given ID was not found.');
    } else {
      res.json(website);
    }
  })
});

app.get('/websites/:id/view_mutex', async (req, res) => {
  try {
    let website = await mutex.aquire(UPDATE_VIEW_TOPIC, async () => {
      let websites = await getWebSites();
      const website = websites.find(w => w.id === parseInt(req.params.id))
      if (!website) {
        return res.status(404).send('The website with the given ID was not found.');
      }
      website.visits++;
      return new Promise((res, rej) => {
        fs.writeFile('./websites.json', JSON.stringify(websites), (err) => {
          if (err) {
            rej(err);
          } else {
            res(website);
          }
        })
      })
    })
    res.status(201).json(website);
  } catch (e) {
    return res.status(400).send(e.message);
  }
});

app.listen(8888, () => {
  console.log("Listen by port: ", 8888)
  fs.writeFileSync("./websites.json", JSON.stringify(websitesSeed));
})
