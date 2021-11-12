# Kadoo

[![NPM version][npm-image]][npm-url]
[![GitHub last commit][commit-image]][commit-url]
[![Travis CI][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![License][license-image]](LICENSE.md)

<!-- [![Dependencies status][dependencies-image]][dependencies-url]
[![Dev Dependencies status][devdependencies-image]][devdependencies-url] -->

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

[npm-image]: https://img.shields.io/npm/v/kadoo.svg?logo=npm&logoColor=fff&label=NPM+package
[release-image]: https://img.shields.io/github/release/jclo/kadoo.svg?include_prereleases
[commit-image]: https://img.shields.io/github/last-commit/jclo/kadoo.svg?logo=github
[travis-image]: https://img.shields.io/travis/com/jclo/es6lib.svg?logo=travis-ci&logoColor=fff
[coveralls-image]: https://img.shields.io/coveralls/jclo/kadoo/master.svg?&logo=coveralls
[dependencies-image]: https://david-dm.org/jclo/kadoo/status.svg?theme=shields.io
[devdependencies-image]: https://david-dm.org/jclo/kadoo/dev-status.svg?theme=shields.io
[npm-bundle-size-image]: https://img.shields.io/bundlephobia/minzip/@mobilabs/kadoo.svg
[license-image]: https://img.shields.io/npm/l/kadoo.svg

[npm-url]: https://www.npmjs.com/package/kadoo
[release-url]: https://github.com/jclo/kadoo/tags
[commit-url]: https://github.com/jclo/kadoo/commits/master
[travis-url]: https://app.travis-ci.com/jclo/kadoo?branch=main
[coveralls-url]: https://coveralls.io/github/jclo/kadoo?branch=master
[dependencies-url]: https://david-dm.org/jclo/kadoo
[devdependencies-url]: https://david-dm.org/jclo/kadoo?type=dev
[license-url]: http://opensource.org/licenses/MIT
[npm-bundle-size-url]: https://img.shields.io/bundlephobia/minzip/kadoo
