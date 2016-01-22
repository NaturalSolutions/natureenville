var Backbone = require('backbone'),
    poiTypes = require('./typepoi'),
    generalTypes = require('./generaltypepoi'),
    $ = require('jquery'),
    Period = require('./period');

Backbone.LocalStorage = require("backbone.localstorage");

var Poi = Backbone.Model.extend({
    defaults: {
        externalId: 0,
        longitude: 0,
        latitude: 0,
        name:'',
        name_en:'',
        name_fr:'',
        name_es:'',
        name_de:'',
        name_it:'',
        visit_time_min: 0 ,
        visit_time_max: 0,
        price_min: '',
        price_max: '',
        type_id: '',
        // general_type_id => dynamic, read it with poi.get('general_type_id')
        street: '',
        postal_code:'',
        phone:'',
        mail:'',
        website:'',
        resa_link:'',
        url_img1:'',
        url_img2:'',
        desc:'',
        desc_en:'',
        desc_fr:'',
        desc_es:'',
        desc_de:'',
        desc_it:'',
        withchild: true,
        period: new Period()
    },

    get: function (attr) {
        if (attr in this.attributes) {
            return Backbone.Model.prototype.get.apply(this, arguments);
        } else if (attr === 'desc_html') {
            return this._descHTML();
        } else if (attr === 'photo_credit_html') {
            return this._creditHTML();
        } else if (attr === 'general_type') {
            return this._generalType();
        }
    },

    _generalType: function() {
        var tid = this.get('type_id'),
            type = poiTypes.find(function(t) {
                return t.get('type_id') === tid;
            });
        if ( type ) {
            var generalType = generalTypes.find(function(gt) {
                return gt.get('id') === type.get('general_type_id');
            });
            return generalType;
        }
    },

    _descHTML: function() {
        return this._trimURL(this.get('desc_fr') || '');
    },

    _creditHTML: function() {
        return this._trimURL(this.get('photo_credit') || '');
    },

    _trimURL: function(s) {
        return s.replace(
            /[A-Za-z]+:\/\/([A-Za-z0-9-_]+([-:%&;\?#=.][A-Za-z0-9\/_]+)+)/g,
            function(url, capt) {
                var shortUrl = capt.length < 20 ? capt : capt.slice(0, 17) + '...';
                return '<a href="' + url + '">' + shortUrl + '</a>';
            }
        );
    },

    // Ensure that each poi created has name, longitude, latitude, type_id, street, postal_code.
    validate: function(attrs, options) {
        var errors = {};
        if (!attrs.name) {
            errors.name = "Le nom est obligatoire.";
         // return "L'information nom est obligatoire.";
        }
        //TODO validate adresse, street and postal code instead of longitude
        if (!attrs.longitude) {
         // return "L'information adresse est obligatoire.";
            errors.geoloc = "L'adresse est obligatoire.";
        }
        // if (!attrs.latitude) {
        //   return "L'information latitude est manquante";
        // }
        // if (!attrs.type_id) {
        //   return "L'information type du POI est manquante";
        // }
        // if (!attrs.street) {
        //   return "L'information rue est manquante";
        // }
        // if (!attrs.postal_code) {
        //   return "L'information code postal est manquante";
        // }
        if(!$.isEmptyObject(errors))return errors;
    }
});

var PoiCollection = Backbone.Collection.extend({
    model: Poi,
    url: '',
    localStorage: new Backbone.LocalStorage("PoiCollection"),
    initialize: function() {
        // Assign the Deferred issued by fetch() as a property
        this.deferred = this.fetch();
    }
});



module.exports = {
    instance: new Poi(),
    instancePoiCollection: new PoiCollection(),
    Poi: Poi,
    PoiCollection: PoiCollection
};

/* example instantiation of model Poi
    var currentPoi = new poi.Poi({
        externalId: 0,
        longitude: 0,
        latitude: 0,
        name:'Pot de fleur',
        name_en:'',
        name_fr:'',
        name_es:'',
        name_de:'',
        name_it:'',
        visit_time_min: 0 ,
        visit_time_max: 0,
        price_min: '',
        price_max: '',
        type_id: '',
        street: 'rue des pieds',
        postal_code:'',
        phone:'',
        mail:'',
        website:'',
        resa_link:'',
        url_img1:'',
        url_img2:'',
        desc:'',
        desc_en:'',
        desc_fr:'',
        desc_es:'',
        desc_de:'',
        desc_it:'',
        withchild: true ,
        period: {}
    });
    currentPoi.get("period").set({
            poi_id: 9990,
            open_hour: 5,
            close_hour: 10,
    });
*/
