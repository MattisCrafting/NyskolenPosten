const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const cacheManager = require('./cache');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// Hent alle brukere
app.get('/api/users', async (req, res) => {
  const clientVersion = parseInt(req.query.version) || 0;
  const currentVersion = cacheManager.getUsersVersion();
  
  if (clientVersion === currentVersion) {
    return res.status(304).send();
  }

  try {
    const users = await cacheManager.getUsers();
    res.json({
      version: currentVersion,
      users: users
    });
  } catch (error) {
    console.error('Feil ved henting av brukere:', error);
    res.status(500).json({ error: 'Kunne ikke hente brukere' });
  }
});

// Hent enkelt bruker
app.get('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const user = await cacheManager.getUser(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Bruker ikke funnet' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Feil ved henting av bruker:', error);
    res.status(500).json({ error: 'Kunne ikke hente bruker' });
  }
});

// Oppdater bruker
app.put('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { role, class: userClass, grade } = req.body;
  
  try {
    const user = await cacheManager.updateUser(id, { 
      role,
      class: userClass,
      grade
    });
    res.json({
      version: cacheManager.getUsersVersion(),
      user: user
    });
  } catch (error) {
    console.error('Feil ved oppdatering av bruker:', error);
    res.status(500).json({ error: 'Kunne ikke oppdatere bruker' });
  }
});

// Opprett ny bruker
app.post('/api/users', async (req, res) => {
  const { email, password, name, role, class: userClass, grade } = req.body;
  
  try {
    const user = await cacheManager.createUser({
      email,
      password, // Merk: I en ekte app må dette krypteres!
      name,
      role,
      class: userClass,
      grade
    });

    res.json({
      version: cacheManager.getUsersVersion(),
      user: user
    });
  } catch (error) {
    console.error('Feil ved opprettelse av bruker:', error);
    res.status(500).json({ error: 'Kunne ikke opprette bruker' });
  }
});

// Hent global status
app.get('/api/global-status', async (req, res) => {
  const clientVersion = parseInt(req.query.version) || 0;
  const currentVersion = cacheManager.getGlobalStatusVersion();
  
  if (clientVersion === currentVersion) {
    return res.status(304).send();
  }

  try {
    const status = await cacheManager.getGlobalStatus();
    
    if (!status) {
      return res.status(404).json({ error: 'Global status ikke funnet' });
    }

    res.json({
      version: currentVersion,
      status: status
    });
  } catch (error) {
    console.error('Feil ved henting av global status:', error);
    res.status(500).json({ error: 'Kunne ikke hente global status' });
  }
});

// Oppdater global status
app.put('/api/global-status', async (req, res) => {
  const { isLocked, lockMessage, lastUpdatedBy } = req.body;
  
  try {
    const status = await cacheManager.updateGlobalStatus({
      isLocked,
      lockMessage,
      lastUpdatedBy
    });

    res.json({
      version: cacheManager.getGlobalStatusVersion(),
      status: status
    });
  } catch (error) {
    console.error('Feil ved oppdatering av global status:', error);
    res.status(500).json({ error: 'Kunne ikke oppdatere global status' });
  }
});

// Hent alle artikler
app.get('/api/articles', async (req, res) => {
  const clientVersion = parseInt(req.query.version) || 0;
  const currentVersion = cacheManager.getArticlesVersion();
  
  if (clientVersion === currentVersion) {
    return res.status(304).send();
  }

  try {
    const articles = await cacheManager.getArticles();
    
    res.json({
      version: currentVersion,
      articles: articles
    });
  } catch (error) {
    console.error('Feil ved henting av artikler:', error);
    res.status(500).json({ error: 'Kunne ikke hente artikler' });
  }
});

// Hent enkelt artikkel
app.get('/api/articles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const article = await cacheManager.getArticle(id);
    
    if (!article) {
      return res.status(404).json({ error: 'Artikkel ikke funnet' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Feil ved henting av artikkel:', error);
    res.status(500).json({ error: 'Kunne ikke hente artikkel' });
  }
});

// Opprett ny artikkel
app.post('/api/articles', async (req, res) => {
  const { title, content, authorId } = req.body;
  
  try {
    const article = await cacheManager.createArticle({
      title,
      content,
      authorId
    });

    res.json({
      version: cacheManager.getArticlesVersion(),
      article: article
    });
  } catch (error) {
    console.error('Feil ved opprettelse av artikkel:', error);
    res.status(500).json({ error: 'Kunne ikke opprette artikkel' });
  }
});

// Oppdater eksisterende artikkel
app.put('/api/articles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, content, published } = req.body;
  
  try {
    const article = await cacheManager.updateArticle(id, {
      title,
      content,
      published
    });

    res.json({
      version: cacheManager.getArticlesVersion(),
      article: article
    });
  } catch (error) {
    console.error('Feil ved oppdatering av artikkel:', error);
    res.status(500).json({ error: 'Kunne ikke oppdatere artikkel' });
  }
});

// Manuell cache-invalidering
app.post('/api/cache/invalidate', async (req, res) => {
  const { type } = req.body;
  
  try {
    if (type === 'articles') {
      await cacheManager.invalidateArticlesCache();
    } else if (type === 'globalStatus') {
      await cacheManager.invalidateGlobalStatusCache();
    } else if (type === 'users') {
      await cacheManager.invalidateUsersCache();
    } else {
      await cacheManager.invalidateArticlesCache();
      await cacheManager.invalidateGlobalStatusCache();
      await cacheManager.invalidateUsersCache();
    }
    
    res.json({ message: 'Cache oppdatert' });
  } catch (error) {
    console.error('Feil ved cache-invalidering:', error);
    res.status(500).json({ error: 'Kunne ikke oppdatere cache' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
}); 