'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();

// CORS 
app.use(cors({ optionsSuccessStatus: 200 }));

// Body parser para POST
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Archivos estáticos
app.use('/public', express.static(process.cwd() + '/public'));

// Página principal
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// "Base de datos" simple en memoria
const urls = []; // { original_url, short_url }

// Ruta de test
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// POST 
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  let urlObj;
  try {
    urlObj = new URL(originalUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Sólo aceptar http y https
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Verificar que el host exista usando DNS
  dns.lookup(urlObj.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Revisar si ya la tenemos guardada
    const existing = urls.find((e) => e.original_url === originalUrl);
    if (existing) {
      return res.json(existing);
    }

    const shortUrl = urls.length + 1;

    const entry = {
      original_url: originalUrl,
      short_url: shortUrl
    };

    urls.push(entry);

    return res.json(entry);
  });
});

// GET 
app.get('/api/shorturl/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.json({ error: 'invalid url' });
  }

  const entry = urls.find((e) => e.short_url === id);
  if (!entry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(entry.original_url);
});

// Levantar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('URL Shortener Microservice listening on port ' + port);
});

module.exports = app;
