'use strict';
var Backbone = require('backbone'),
    $ = require('jquery'),
    currentPos = require('./current-position'),
    moment = require('moment'),
    momentFr = require('moment/locale/fr');

var bootstrap = require('bootstrap');
var jqueryNs = require('jquery-ns');
var badgesInstanceColl = require('./models/badge').instanceColl;
var badgesColl = require('./models/badge').BadgeCollection;


function init() {
    //Manage geolocation when the application goes to the background
    document.addEventListener('resume', function() {
        currentPos.watch();
    }, false);
    document.addEventListener('pause', function() {
        currentPos.unwatch();
    }, false);
    currentPos.watch();

    window.addEventListener('native.keyboardshow', function() {
        $('body').addClass('keyboardshow');
    });
    window.addEventListener('native.keyboardhide', function() {
        $('body').removeClass('keyboardshow');
    });

    moment.locale('fr');

    var bC = new badgesColl();
    bC.fetch({
        success : function(response){
            if(response.length === 0){
                badgesInstanceColl.fetch({
                    ajaxSync: true,
                    success : function(coll){
                        coll.models.forEach(function(n, key){
                            badgesInstanceColl.add(n).save();
                        });
                    }
                });
            }else{
                badgesInstanceColl.fetch();
            }
        }
    });

    var containerView = require('./container/container');
    containerView.render().$el.appendTo('body');

    Backbone.history.start();
}

if (window.cordova) {
    setTimeout(function() {
        $('.splashscreen').remove();
        document.addEventListener("deviceready", init, false);
    }, 3000);

} else {
    setTimeout(function() {
        $('.splashscreen').remove();
        $(document).ready(init);
    }, 500);
}
