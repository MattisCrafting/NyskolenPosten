const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CacheManager {
  constructor() {
    this.cache = {
      articles: {
        version: 0,
        data: new Map(),
        lastUpdated: null
      },
      globalStatus: {
        version: 0,
        data: null,
        lastUpdated: null
      },
      users: {
        version: 0,
        data: new Map(),
        lastUpdated: null
      }
    };
    
    // Initialiser cache fra database
    this.initializeCache();
  }

  async initializeCache() {
    try {
      // Last artikler
      const articles = await prisma.article.findMany({
        include: {
          author: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      articles.forEach(article => {
        this.cache.articles.data.set(article.id, article);
      });
      
      // Last global status
      const status = await prisma.globalStatus.findFirst({
        include: {
          updatedBy: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      if (status) {
        this.cache.globalStatus.data = status;
      }

      // Last brukere
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      users.forEach(user => {
        this.cache.users.data.set(user.id, user);
      });
      
      console.log('Cache initialisert fra database');
    } catch (error) {
      console.error('Feil ved initialisering av cache:', error);
    }
  }

  // Bruker-metoder
  async getUsers() {
    return Array.from(this.cache.users.data.values());
  }

  async getUser(id) {
    return this.cache.users.data.get(id);
  }

  async createUser(data) {
    try {
      const user = await prisma.user.create({
        data: {
          ...data
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      this.cache.users.data.set(user.id, user);
      this.cache.users.version += 1;
      this.cache.users.lastUpdated = new Date();

      return user;
    } catch (error) {
      console.error('Feil ved opprettelse av bruker i cache:', error);
      throw error;
    }
  }

  // Artikkel-metoder
  async getArticles() {
    return Array.from(this.cache.articles.data.values());
  }

  async getArticle(id) {
    return this.cache.articles.data.get(id);
  }

  async updateArticle(id, data) {
    try {
      const article = await prisma.article.update({
        where: { id },
        data: {
          ...data,
          version: { increment: 1 }
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      this.cache.articles.data.set(id, article);
      this.cache.articles.version += 1;
      this.cache.articles.lastUpdated = new Date();

      return article;
    } catch (error) {
      console.error('Feil ved oppdatering av artikkel i cache:', error);
      throw error;
    }
  }

  async createArticle(data) {
    try {
      const article = await prisma.article.create({
        data: {
          ...data,
          version: 1
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      this.cache.articles.data.set(article.id, article);
      this.cache.articles.version += 1;
      this.cache.articles.lastUpdated = new Date();

      return article;
    } catch (error) {
      console.error('Feil ved opprettelse av artikkel i cache:', error);
      throw error;
    }
  }

  // Global status metoder
  async getGlobalStatus() {
    return this.cache.globalStatus.data;
  }

  async updateGlobalStatus(data) {
    try {
      const status = await prisma.globalStatus.upsert({
        where: { id: 1 },
        update: data,
        create: {
          ...data,
          id: 1
        },
        include: {
          updatedBy: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      this.cache.globalStatus.data = status;
      this.cache.globalStatus.version += 1;
      this.cache.globalStatus.lastUpdated = new Date();

      return status;
    } catch (error) {
      console.error('Feil ved oppdatering av global status i cache:', error);
      throw error;
    }
  }

  // Versjonskontroll
  getArticlesVersion() {
    return this.cache.articles.version;
  }

  getGlobalStatusVersion() {
    return this.cache.globalStatus.version;
  }

  getUsersVersion() {
    return this.cache.users.version;
  }

  // Cache invalidering
  async invalidateArticlesCache() {
    await this.initializeCache();
  }

  async invalidateGlobalStatusCache() {
    const status = await prisma.globalStatus.findFirst({
      include: {
        updatedBy: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (status) {
      this.cache.globalStatus.data = status;
      this.cache.globalStatus.version += 1;
      this.cache.globalStatus.lastUpdated = new Date();
    }
  }

  async invalidateUsersCache() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    users.forEach(user => {
      this.cache.users.data.set(user.id, user);
    });
    this.cache.users.version += 1;
    this.cache.users.lastUpdated = new Date();
  }
}

// Eksporter en singleton-instans
const cacheManager = new CacheManager();
module.exports = cacheManager; 