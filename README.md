# Kadoo

[![NPM version][npm-image]][npm-url]
[![Travis CI][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependencies status][dependencies-image]][dependencies-url]
[![Dev Dependencies status][devdependencies-image]][devdependencies-url]
[![License][license-image]](LICENSE.md)
<!--- [![node version][node-image]][node-url] -->

[![NPM install][npm-install-image]][npm-install-url]


`Kadoo` is an ultralight bundler that encapsulates each javascript source file inside an IIFE module and the whole inside an UMD module or an ES6 module. The generated output is an UMD library, or an ES6 module, that could run on both Node.js and the browsers.

`Kadoo` is an ideal tool for those who don't like that their code is polluted by a lot of foreign code. `Kadoo` adds only two lines to your library and replace the `import` and `export` keywords by links that interconnect your modules.



## Quick Startup

Write your source files with the `import` and `export` statements like this:

```javascript
import A from '../a';

// Your public methods:
const B = {
  a() {
    ...
  },
  b() {
    ...
  },
}

export default B;
```

`Kadoo` encapsulates your source file into an IIFE module.

It replaces `import` and `export` by links.

The resulting output looks like:

```javascript
(function() {
  const A = $__TREE.src.x.y.a;

  ... your unaltered code

  $__TREE.extend($__TREE.src.x.b, B);
}());
```

Then, it bundles all the files, of your project, in a unique output file. As each file is embedded in an IIFE module, it prevents any conflict between the different portions of your Javascript code.

The IIFE modules are connected together by the links that replace the `import` and `export` statements.

When you look at the resulting output, you can see that your code is almost unaltered. `Kadoo` adds just two lines at the top of your library in addition to the links that replace the `import` and `export` keywords.

[ES6Kadoo](https://www.npmjs.com/package/@mobilabs/es6kadoo) is a boilerplate that allows you writing libraries that rely on `Kadoo`.


## How to use it

### From a command line

```bash
./node_modules/.bin/kadoo build --name './src/main.js' --outpout '/dist/bundle.js' --type 'umd'
```

### From a Javascript script

```javascript
const Kadoo = require('kadoo');

// By default, the generated output is an UMD module.
// If you want to generate an ES6 module, you have
// to specify 'es6' as the type.
const kadoo = Kadoo('./src/main.js', { type: 'umd'});

kadoo.get((data) => {
  fs.writeFile('./dist/bundle.js', data, 'utf8', (err) => {
    if (err) throw err;
    process.stdout.write('The UMD module is saved in "./dist/bundle.js"\n');
  });
});
```

### Using Gulp

```javascript
const Kadoo = require('kadoo');

// By default, the generated output is an UMD module.
// If you want to generate an ES6 module, you have
// to specify 'es6' as the type.
const kadoo = Kadoo('./src/main.js', { type: 'es6' });

function build() {
  return kadoo.bundle()
    .pipe(concat('bundle.js'))
    .pipe(dest('./dist'))
  ;
}
```

## License

[MIT](LICENSE.md).

<!--- URls -->

[npm-image]: https://img.shields.io/npm/v/kadoo.svg?style=flat-square
[npm-install-image]: https://nodei.co/npm/kadoo.png?compact=true
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square
[download-image]: https://img.shields.io/npm/dm/kadoo.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/jclo/kadoo.svg?style=flat-square
[coveralls-image]: https://img.shields.io/coveralls/jclo/kadoo/master.svg?style=flat-square
[dependencies-image]: https://david-dm.org/jclo/kadoo/status.svg?theme=shields.io
[devdependencies-image]: https://david-dm.org/jclo/kadoo/dev-status.svg?theme=shields.io
[license-image]: https://img.shields.io/npm/l/kadoo.svg?style=flat-square

[npm-url]: https://www.npmjs.com/package/kadoo
[npm-install-url]: https://nodei.co/npm/kadoo
[node-url]: http://nodejs.org/download
[download-url]: https://www.npmjs.com/package/kadoo
[travis-url]: https://travis-ci.org/jclo/kadoo
[coveralls-url]: https://coveralls.io/github/jclo/kadoo?branch=master
[dependencies-url]: https://david-dm.org/jclo/kadoo
[devdependencies-url]: https://david-dm.org/jclo/kadoo?type=dev
[license-url]: http://opensource.org/licenses/MIT
