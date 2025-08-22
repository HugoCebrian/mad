import { google } from 'googleapis'
import { colIndexToA1, toStr } from './utils'
//const { google } = require('googleapis');
//const { colIndexToA1, toStr } = require('./utils');

export class GoogleSheetsStorage {
  constructor(opts) {
    if (!(opts && opts.clientEmail && opts.privateKey)) {
      throw new Error('Missing clientEmail/privateKey for Google Sheets service account.');
    }

    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      credentials: {
        client_email: opts.clientEmail,
        private_key: opts.privateKey.replace(/\\n/g, '\n'),
      },
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.db = opts.db;
    this.table = opts.table || 'Sheet1';
    this.cacheTimeoutMs = opts.cacheTimeoutMs ?? 5000;

    this.schema = [];
    this.schemaMeta = {};           // { fieldName: { col } }
    this.data = [];                 // rows excluding header
    this.lastUpdated = null;
  }

  

  async load() {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.db,
      range: this.table,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) {
      throw new Error(`Sheet "${this.table}" is empty or missing a header row.`);
    }

    this.schema = rows[0];
    this.schemaMeta = Object.fromEntries(this.schema.map((name, idx) => [name, { col: idx }]));
    this.data = rows.slice(1);
    this.lastUpdated = Date.now();
  }

  async _ensureFresh() {
    if (!this.lastUpdated || Date.now() - this.lastUpdated >= this.cacheTimeoutMs) {
      await this.load();
    }
  }

  _findRowIndices(query) {
    if (!query || Object.keys(query).length === 0) {
      return this.data.map((_, i) => i);
    }

    const keys = Object.keys(query);
    const matches = [];

    this.data.forEach((row, idx) => {
      for (const key of keys) {
        const meta = this.schemaMeta[key];
        if (!meta) return; // field missing
        const cell = row[meta.col] ?? '';
        if (toStr(cell) !== toStr(query[key])) return;
      }
      matches.push(idx);
    });

    return matches;
  }

  _rowToDoc(row) {
    const doc = {};
    for (let i = 0; i < this.schema.length; i++) {
      doc[this.schema[i]] = row[i] ?? '';
    }
    return doc;
  }

  _docToRow(doc) {
    const row = new Array(this.schema.length).fill('');
    for (const k of Object.keys(doc)) {
      const meta = this.schemaMeta[k];
      if (!meta) continue;
      row[meta.col] = toStr(doc[k]);
    }
    return row;
  }

  async find(query) {
    await this._ensureFresh();
    const idxs = this._findRowIndices(query);
    return idxs.map(i => this._rowToDoc(this.data[i]));
  }

  async column(query) {
    await this._ensureFresh();
    return this.data.map(row => {
      const meta = this.schemaMeta[query];
      if (!meta) return '';
      return row[meta.col] ?? '';
    })
  }

  async insert(docs) {
    await this._ensureFresh();
    const rows = docs.map(d => this._docToRow(d));

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.db,
      range: this.table,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    this.data.push(...rows);
    return rows.map(r => this._rowToDoc(r));
  }

  async update(query, toUpdate, updatedOnce = false) {
    await this._ensureFresh();
    const targets = this._findRowIndices(query);
    if (targets.length === 0) return [];

    const indices = updatedOnce ? [targets[0]] : targets;
    const endColA1 = colIndexToA1(this.schema.length - 1);
    const updatedDocs = [];

    await Promise.all(
      indices.map(async (idx) => {
        const oldDoc = this._rowToDoc(this.data[idx]);
        const merged = Object.assign({}, oldDoc, toUpdate);
        const row = this._docToRow(merged);
        updatedDocs.push(this._rowToDoc(row));

        const a1 = `${this.table}!A${idx + 2}:${endColA1}${idx + 2}`;
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.db,
          range: a1,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });

        this.data[idx] = row;
      })
    );

    return updatedDocs;
  }

  

  async remove(query) {
    await this._ensureFresh();
    const targets = this._findRowIndices(query);
    if (targets.length === 0) return [];

    const endColA1 = colIndexToA1(this.schema.length - 1);
    const emptyRow = new Array(this.schema.length).fill('');
    const removed = [];

    await Promise.all(
      targets.map(async (idx) => {
        removed.push(this._rowToDoc(this.data[idx]));

        const a1 = `${this.table}!A${idx + 2}:${endColA1}${idx + 2}`;
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.db,
          range: a1,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [emptyRow] },
        });

        this.data[idx] = emptyRow;
      })
    );

    return removed;
  }
}
