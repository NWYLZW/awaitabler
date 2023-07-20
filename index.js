// @ts-check
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    factory(exports);
  } else {
    // Browser globals
    // @ts-ignore
    factory((root.awaitabler = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {
  'use strict';
  /** @typedef {import('./global')} */
  /** @typedef {import('./index')} Awaitabler */
  /** @type {Awaitabler} */
  const e = exports
  /** @type {Awaitabler.Middleware[]} */
  const middlewares = []

  e.defineMiddleware = function (mid) {
    middlewares.push(mid)
    return e.defineMiddleware
  }

  e.registerString = function () {
    window.StringFunction = (str) => {
      return async (a0, ...args) => {
        if (Array.isArray(a0)) {
          // template literals mode
          // 'url'`${'123'}`
        } else {
          // call function mode
          // 'url'({})
        }
      }
    }
    String.prototype.then = /** @type {String['then']} */ (function (on0, on1) {
      return fetch(this.toString()).then(on0, on1)
    })
  }

  e.supportFetch = function () {
    e.defineMiddleware((ctx, next) => {
      if (['http', 'https'].includes(ctx.schema)) {
      }
      return next()
    })
  }
  e.registerAll = function () {
    e.registerString()
  }
}));
