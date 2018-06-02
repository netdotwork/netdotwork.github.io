const path = require('path');

const n = obj => typeof obj === 'string' ? obj.replace(/\\/g, '/') : obj;

for (let k in path) {
  const v = path[k];
  exports[k] = typeof v === 'function' ? (...args) => n(v(...args.map(n))) : v;
}
