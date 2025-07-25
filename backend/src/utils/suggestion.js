import pool from '../utils/db.js';
import { Trie } from '../utils/trie.js';

// In-memory tries
let skillTrie = new Trie();
let userTrie = new Trie();

// Load all skills and users into tries
export async function buildSuggestionTries() {
  skillTrie = new Trie();
  userTrie = new Trie();
  // Load skills
  const skills = await pool.query('SELECT name FROM skills');
  for (const row of skills.rows) {
    skillTrie.insert(row.name, row.name);
  }
  // Load users (suggest by name, but you can add email/ID if needed)
  const users = await pool.query("SELECT name FROM users");
  for (const row of users.rows) {
    userTrie.insert(row.name, row.name);
  }
}

export function suggestSkills(prefix) {
  return skillTrie.startsWith(prefix, 10);
}

export function suggestUsers(prefix) {
  return userTrie.startsWith(prefix, 10);
}
