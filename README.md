# reliable-slave

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/reliable-slave.svg?style=flat-square
[npm-url]: https://npmjs.org/package/reliable-slave
[download-image]: https://img.shields.io/npm/dm/reliable-slave.svg?style=flat-square
[download-url]: https://npmjs.org/package/reliable-slave

reliable-slave is the slave part of the [reliable](https://github.com/reliablejs). Here for adapt to [macaca-client](https://github.com/macacajs/macaca-client), which in order to provide continuous integration service.

## Installment

```shell
$ npm i reliable-slave -g
```

## Quick Start

```shell
# connect to reliable master
$ reliable server -m <reliable-master:port> --verbose
```

## Docs

[reliable-slave Deployment Guide](./docs/en/deploy.md)

## License

[MIT](LICENSE)
