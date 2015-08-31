'use strict';

/*
 * Dependencies
 */
var BaseView = require('../baseview'),
    currentPos = require('../current-position'),
    ol = require('planet-maps/dist/ol-base');

/*
 * Utilities
 */
function getScaleFactor(resolution) {
    // Compute a scale factor depending on resolution
    if (resolution > 10) {
        return 2;
    } else if (resolution > 2) {
        return 3;
    } else if (resolution > 0.1) {
        return 5;
    } else if (resolution > 0.05) {
        return 6;
    } else {
        return 8;
    }
}
function styleFromType(poiType) {
    // Assign a color for a POI type
    var style = {
        color: [0,0,0], // Defaults to black
        icon: '' // FIXME: any default?
    };
    switch (poiType) {
        // General type 1
        case 7:
            style.color = [96, 140, 51];
            style.icon = 'images/general_types/1-avenue_tree.png';
            break;
        // General type 2
        case 3:
            style.color = [206, 0, 127];
            style.icon = 'images/general_types/2-remarkable_tree.png';
            break;
        // General type 3
        case 1:
        case 2:
        case 11:
        case 12:
        case 13:
            style.color = [111, 165, 28];
            style.icon = 'images/general_types/3-park_garden.png';
            break;
        // General type 4
        case 10:
            style.color = [243, 152, 27];
            style.icon = 'images/general_types/4-strange_place.png';
            break;
        // General type 5
        case 6:
            style.color = [121, 33, 129];
            style.icon = 'images/general_types/5-revegetated_street.png';
            break;
        // General type 6
        case 9:
            style.color = [227, 1, 55];
            style.icon = 'images/general_types/6-wild_plant.png';
            break;
        // General type 7
        case 4:
        case 5:
            style.color = [0, 104, 132];
            style.icon = 'images/general_types/7-vegetable_garden.png';
            break;
        // General type 8
        case 8:
            style.color = [60, 165, 148];
            style.icon = 'images/general_types/8-landscaping.png';
            break;
    }
    return style;
}

/*
 * OpenLayers map configuration
 */
var view = new ol.View(), // Map visible area (parameters will be set during view rendering)
    tripSource = new ol.source.Vector(), // Datasource for trips
    poiSource = new ol.source.Vector(), // Datasource for POIs
    currentPosSource = new ol.source.Vector(), // Datasource for current position
    wktParser = new ol.format.WKT(), // WKT parser will decode geometries from the MagicTour data
    map = new ol.Map({
        layers: [
            // Layer 1: Basemap
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'http://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                    attributions: [new ol.Attribution({ html: ['&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'] })]
                })
            }),
            // Layer 2: Trips
            new ol.layer.Vector({
                source: tripSource,
                style: function(feature, resolution) {
                    var g = feature.getGeometry(),
                        sf = getScaleFactor(resolution),
                        styles = [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: '#46b992',
                                    width: 1*sf
                                })
                            })
                        ],
                        dist = 0;

                    if (resolution > 5) {
                        // Do not draw any arrow above this resolution
                        return styles;
                    }

                    g.forEachSegment(function(start, end) {
                        var dx = end[0] - start[0],
                            dy = end[1] - start[1],
                            rotation = Math.atan2(dy, dx);

                        // Compute cumulative length
                        dist += Math.sqrt(dx*dx + dy*dy);
                        if (dist < 3000/(sf*sf)) {
                            // Do not draw before a certain distance threshold 
                            return;
                        } else {
                            // Reset distance accumulator
                            dist = 0;
                            // Draw an arrow at the end of this segment
                            styles.push(
                                new ol.style.Style({
                                    geometry: new ol.geom.Point(end),
                                    image: new ol.style.Icon({
                                        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6"><polyline points="2,1 4,3 2,5" fill="none" stroke="#46b992" stroke-width="1" /></svg>',
                                        anchor: [0.5, 0.5],
                                        scale: 1*sf,
                                        rotateWithView: false,
                                        rotation: -rotation
                                    })
                                })
                            );
                        }
                    });
                    return styles;
                }
            }),
            // Layer 3: POIs
            new ol.layer.Vector({
                source: poiSource,
                style: function(feature, resolution) {
                    var sf = getScaleFactor(resolution),
                        styleParams = styleFromType(parseInt(feature.l.place_type)); // FIXME: why using this ".l"??? Looks like a bug in OL? Or in planet-maps build?
                    if (resolution > 50) {
                        // Do not display POI
                        return [];
                    } else if (resolution > 5) {
                        // Display POI as a simple small circle
                        return [new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 2*sf,
                                fill: new ol.style.Fill({
                                    color: styleParams.color.concat(1)
                                })
                            })
                        })];
                    } else if (resolution > 2) {
                        // Display POI with semi-opaque fill + plain edge
                        return [new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 2*sf,
                                fill: new ol.style.Fill({
                                    color: styleParams.color.concat(0.5)
                                }),
                                stroke: new ol.style.Stroke({
                                    color: styleParams.color.concat(1),
                                    width: 1*sf
                                })
                            })
                        })];
                    } else {
                        return [new ol.style.Style({
                            image: new ol.style.Icon({
                                anchor: [0.5, 0.5],
                                src: styleParams.icon
                            })
                        })];
                    }
                }
            }),
            // Layer 4: Current position
            new ol.layer.Vector({
                source: currentPosSource,
                style: new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 0.5],
                        src: 'images/location.png'
                    })
                })
            })
        ],
        view: view
    });

/*
 * Current position management
 */
currentPos.promise().done(function(attrs) {
    // When location is known, add a marker to the map
    var coords = ol.proj.transform([attrs.longitude, attrs.latitude], 'EPSG:4326', 'EPSG:3857'),
        pos = new ol.Feature({
            geometry: new ol.geom.Point(coords)
        });
    currentPosSource.addFeature(pos);
    // Update marker position when location change
    currentPos.on('change', function(model) {
        var coords = ol.proj.transform([model.get('longitude'), model.get('latitude')], 'EPSG:4326', 'EPSG:3857');
        pos.setGeometry(new ol.geom.Point(coords))  ;
    });
});

/*
 * Backbone view
 */
var TourMapView = BaseView.extend({
    template: require('./tourMap.html'),
    activeTab: true,

    events: {
        'click .btn-interest': 'onBtnInterestClick',
        'click .btn-position': 'onBtnPositionClick',
        'click .btn-distance': 'onBtnDistanceClick',
        'click .btn-time': 'onBtnTimeClick'
    },

    initialize: function (options) {
        this.listenTo(this.model, 'request', this.onRequest);
        this.listenTo(this.model, 'change', this.reload);
        this.listenTo(this.model.request, 'change', this.updateButtonLabels);

        this.mode = options.mode;

        BaseView.prototype.initialize.apply(this, arguments);
    },

    displayTrips: function() {
        var trips = this.model.get('trip') || [],
            // Iterate over trip segments and prepare them for OL display
            features = trips.map(function (trip, idx, arr) {
                // Parse a segment and build an OL feature
                var feature = wktParser.readFeature(trip.geom);

                // Convert GPX/WGS84 coordinates to Spherical Mercator (which is the basemap projection)
                feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');

                return feature;
            });
        // Add features to the vector layer
        tripSource.addFeatures(features);
    },

    displayPOIs: function() {
        var pois = this.model.get('stops') || [],
            // Iterate over POIs, parse them and build ol.Feature for OL display
            features = pois.map(function (poi, idx, arr) {
                var feat = new ol.Feature({
                    geometry: wktParser.readGeometry(poi.geom).transform('EPSG:4326', 'EPSG:3857'), // Convert GPX/WGS84 coordinates to Spherical Mercator (which is the basemap projection)
                    place_type: poi.place_type,
                    place_name: poi.place_name
                });
                feat.setId(parseInt(poi.poi_id));
                return feat;
            });
        // Add features to the vector layer
        poiSource.addFeatures(features);
    },

    onRequest: function () {
        // Clear vector layer
        tripSource.clear();
        poiSource.clear();
    },

    load: function () {
        this.displayTrips();
        this.displayPOIs();
    },

    reload: function () {
        this.load();
        view.fit(tripSource.getExtent(), map.getSize());
    },

    zoomToPOI: function (poiId) {
        var feat = poiSource.getFeatureById(parseInt(poiId));
        if (feat) {
            view.setZoom(18);
            view.setCenter(feat.getGeometry().getCoordinates());
        } else {
            console.log('[zoomToPOI] Error: feature ' + poiId + ' is unknown.');
        }
    },

    centerOnCurrentPosition: function () {
        currentPos.promise().done(function() {
            view.setZoom(15);
            view.setCenter(ol.proj.transform([currentPos.get('longitude'), currentPos.get('latitude')], 'EPSG:4326', 'EPSG:3857'));
        });
    },

    updateButtonLabels: function () {
        this.$el.find('.btn-distance .badge').text(this.model.request.getDistanceKm() + ' Km');
        this.$el.find('.btn-time .badge').text(this.model.request.getTimeLabel());
    },

    afterRender: function () {
        this.updateButtonLabels();

        // Configure destination form
        var req = this.model.request;
        this.$el.find('.tour-destination input').geocomplete({
            country: "FR"
        }).bind("geocode:result", function(event, result) {
            var place = result.geometry.location;
            req.set({
                arr_x: place.lng(),
                arr_y: place.lat()
            });
            req.trigger('reload');
        }).bind("geocode:error", function(event, status) {
            console.log("ERROR: " + status);
        });
        this.setMode(this.mode);

        if (! this.model.isEmpty) {
            // A magictour exist: show trips and POIs
            this.load();
        } else {
            // Magictour is not loaded yet: show a spinner and let the model's change event trigger a display
            this.onRequest();
        }

        // Attach map to the DOM (to the #map element)
        map.setTarget('map');

        // At first render, compute a visible area and display it, otherwiser reload map with the previous visibla area
        if (! view.getCenter()) {
            if (tripSource.getFeatures().length > 0) {
                // Make trip visible
                view.fit(tripSource.getExtent(), map.getSize());
            } else {
                // Make user's current position visible
                this.centerOnCurrentPosition();
            }
        }
    },

    switchTabContent: function(active) {
        this.activeTab = active;
        if (this.activeTab) {
            this.$el.addClass('active');
        } else {
            this.$el.removeClass('active');
        }
    },

    serialize: function () {
        return {
            active: this.activeTab ? 'active' : ''
        };
    },

    setMode: function (mode) {
        // Update destination form visibility, always (used for UI init)
        if (mode === 'direction') {
            this.$el.find('.tour-destination').show();
        } else {
            this.$el.find('.tour-destination').hide();
        }

        // If the mode is already on screen, we don't need more
        if (mode === this.mode) {
            return;
        }

        // Keep track of current mode
        this.mode = mode;

        if (mode === 'direction') {
            // Reset form
            this.$el.find('.tour-destination input').val('');
            // Clear tour request and let the user chose a destination
            this.model.request.unset('arr_x');
            this.model.request.unset('arr_y');
            this.model.clear();
            this.onRequest();
        } else {
            // Request a tour with arr == dep
            this.model.request.set({
                arr_x: this.model.request.get('dep_x'),
                arr_y: this.model.request.get('dep_y')
            });
            this.model.request.trigger('reload');
        }
    },

    onBtnInterestClick: function(e) {
        e.preventDefault();
        var InterestFormView = require('./interestForm.js'),
            dialog = new InterestFormView({model: this.model.request});
        dialog.render();
    },

    onBtnPositionClick: function(e) {
        e.preventDefault();
        var PositionFormView = require('./originForm.js'),
            dialog = new PositionFormView({model: this.model.request, mode: this.mode});
        dialog.render();
    },

    onBtnDistanceClick: function(e) {
        e.preventDefault();
        var DistanceFormView = require('./distanceForm.js'),
            dialog = new DistanceFormView({model: this.model.request});
        dialog.render();
    },

    onBtnTimeClick: function(e) {
        e.preventDefault();
        var TimeFormView = require('./timeForm.js'),
            dialog = new TimeFormView({model: this.model.request});
        dialog.render();
    }
});

module.exports = TourMapView;
