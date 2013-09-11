var _           = require('underscore');
var Backbone    = require('backbone');
var router      = require('./router');
var middleware  = require('./middleware');
var persistence = require('./persistence');

// Keep a reference to the current document head element
var docHead = document.head || document.getElementsByTagName('head')[0];

/**
 * Configuration is a static backbone model that we listen to for changes in
 * application setup.
 *
 * @type {Object}
 */
var config = module.exports = new Backbone.Model();

/**
 * Updates a base url tag when the referrer id changes.
 */
config.listenTo(config, 'change:referrer', (function () {
  var base = document.getElementsByTagName('base')[0];

  return function (_, referrer) {
    if (base) { base.parentNode.removeChild(base); }

    base = document.createElement('base');
    base.setAttribute('href', referrer);
    base.setAttribute('target', '_parent');
    docHead.appendChild(base);
  };
})());

/**
 * Listen to requests to start a new notebook and use the content from the
 * config object.
 *
 * @param  {Object}   data
 * @param  {Function} next
 * @param  {Function} done
 */
middleware.use('persistence:load', function (data, next, done) {
  if (config.get('content')) {
    data.notebook = config.get('content');
    return done();
  }
  return next();
});

/**
 * Listens to updates on the alias config and aliases the global variables.
 *
 * @param  {Object} model
 * @param  {Object} alias
 */
config.listenTo(config, 'change:alias', function (model, alias) {
  // Removes previous globals
  _.each(model.previousAttributes().alias, function (_, key) {
    delete global[key];
  });

  _.each(alias, function (value, key) {
    global[key] = value;
  });
});

/**
 * Listens for global id changes and updates persistence. Primarily for loading
 * a new notebook from the embed frame where the current url scheme is unlikely
 * to be maintained.
 */
config.listenTo(config, 'change:id', function (_, id) {
  return persistence.set('id', id);
});

/**
 * Listens for config data changes and sets a config property on the middleware
 * object that represents the config. Useful for middleware to access config
 * variables.
 */
config.listenTo(config, 'change', function () {
  middleware.config = config.toJSON();
});
