'use strict';

var BaseView = require('../baseview');
var $ = require('jquery');
var _ = require('lodash');
var utilities = require('../utilities');

var TourDetailsView = BaseView.extend({
    template: require('./tourDetails.html'),

    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model, 'request', this.render);

        BaseView.prototype.initialize.apply(this, arguments);
    },

    serialize: function () {
        return {
            steps: this.model.isEmpty ? [] : this.model.attributes.stops.map(function(step, i) {
                var poi = step.get('poi'),
                    data = {
                        name: step.get('name_fr'),
                        displayTime: utilities.formatMinutes( step.isDeparture() ? step.get('departure') : step.get('arrival') ),
                        isPoi: poi !== void 0,
                        isDeparture: step.isDeparture(),
                        isArrival: step.isArrival(),
                        type: step.get('type')
                    };
                if (data.isPoi) {
                    data.desc = poi.get('desc_html');
                    data.image = poi.get('url_img1');
                    data.creditPhoto = poi.get('photo_credit_html');
                    data.poiId = poi.id;
                    data.generalType = poi.get('general_type').get('id');
                }
                return data;
            })
        };
    },

    afterRender: function() {
        this.$el.find('.collapse').on('show.bs.collapse', function (e) {
            $(e.currentTarget).parent().addClass('open');
        });
        this.$el.find('.collapse').on('hide.bs.collapse', function (e) {
            $(e.currentTarget).parent().removeClass('open');
        });
    }
});

module.exports = TourDetailsView;
