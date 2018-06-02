# npath

Normalized path module, forward slash all the things.

```
const path = require('npath');

// Do anything you'd do with the Node.js path module, but all paths will be
// normalized to forward slashes.
path.join('foo\\bar', 'buz/baz'); // => 'foo/bar/buz/baz'
```
