const { GoogleSheetsStorage } = require('./storage');

export default class Database {
  constructor(opts) {
    this.storage = new GoogleSheetsStorage(opts);
  }

  load() { return this.storage.load(); }

  insert(docs) { return this.storage.insert(docs); }

  find(query) { return this.storage.find(query); }

  async findOne(query) {
    const docs = await this.find(query);
    return docs[0] || null;
    }
  
  update(query, toUpdate) { return this.storage.update(query, toUpdate, false); }

  async updateOne(query, toUpdate) {
    const docs = await this.storage.update(query, toUpdate, true);
    return docs[0] || null;
  }

  remove(query) { return this.storage.remove(query); }

  async removeOne(query) {
    const docs = await this.storage.remove(query);
    return docs[0] || null;
  }
}

