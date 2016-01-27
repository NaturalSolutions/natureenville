'use strict';

var Backbone = require('backbone');

describe('Backbone normal operation suite', function() {
    it('instantiate a Collection', function() {
        var collection = new Backbone.Collection();
        expect(typeof collection).toMatch('object');
    });

    it('instantiate a Model', function() {
        var model = new Backbone.Model();
        expect(typeof model).toMatch('object');
    });

    it('instantiate a View', function() {
        var view = new Backbone.View();
        expect(typeof view).toMatch('object');
    });

    it('instantiate a Router', function() {
        var router = new Backbone.Router();
        expect(typeof router).toMatch('object');
    });
});
