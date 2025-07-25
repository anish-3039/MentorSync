// Trie implementation for fast prefix search
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
    this.values = [];
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, value) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) node.children[char] = new TrieNode();
      node = node.children[char];
    }
    node.isEnd = true;
    node.values.push(value);
  }

  startsWith(prefix, limit = 10) {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    // BFS to collect up to limit suggestions
    const results = [];
    const queue = [[node, prefix]];
    while (queue.length && results.length < limit) {
      const [curr, currPrefix] = queue.shift();
      if (curr.isEnd) results.push(...curr.values);
      for (const [char, child] of Object.entries(curr.children)) {
        queue.push([child, currPrefix + char]);
      }
    }
    return results.slice(0, limit);
  }
}
export { Trie };
