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

// Create an instance of the express application
const app = express();

// Enable CORS, body-parser, morgan, and helmet middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(helmet());




/////////////////// functions ///////////////////////
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

async function setWebsites(websites = []) {
  return new Promise((resolve, reject) => {
    fs.writeFile('./websites.json', JSON.stringify(websites), (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(true);
      }
    })
  })
}

/////////////////////////ROUTES//////////////////////////////////////////
app.get('/websites', async (req, res) => {
  let websites = await getWebSites();
  res.json(websites);
});

app.post('/websites', async (req, res) => {
  try {
    const { name, description } = req.body;
    const website = new WebSite(name, description);
    let websites = await getWebSites();
    websites.push(website);
    await setWebsites(websites)
    return res.status(201).json(website);
  } catch (error) {
    return res.status(400).json(error);
  }
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
  try {
    let websites = await getWebSites();
    const website = websites.find(w => w.id === parseInt(req.params.id))
    if (!website) {
      return res.status(404).send('The website with the given ID was not found.');
    }
    website.visits++;
    await setWebsites(websites);
    res.json(website);
  } catch (error) {
    return res.status(400).json(error);
  }
});

app.get('/websites/:id/view_mutex', async (req, res) => {
  try {
    let websiteUpdated = await mutex.aquire(`${UPDATE_VIEW_TOPIC}`, async () => {
      let websites = await getWebSites();
      const website = websites.find(w => w.id === parseInt(req.params.id))
      if (!website) {
        return res.status(404).send('The website with the given ID was not found.');
      }
      website.visits++;
      await setWebsites(websites);
      return website;
    }, { timeout: undefined })
    res.status(201).json(websiteUpdated);
  } catch (e) {
    return res.status(400).send(e.message);
  }
});

app.listen(8888, () => {
  console.log("Listen by port: ", 8888)
  fs.writeFileSync("./websites.json", JSON.stringify(websitesSeed));
})
