// Create a GoogleMaps object
var Map = function (element, opts) {
    this.gMap = new google.maps.Map(element, opts);
    this.zoom = function (level) {
        if (level) {
            this.gMap.setZoom(level);
        } else {
            return this.gMap.getZoom();
        }
    };
};

// Set Map Settings
var mapSettings = {
    center: {
        lat: 41.7055, lng: -81.349
    },
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

var element = document.getElementById('map-canvas'),
    iconSelected = './images/gMapPin.png';
var map = new Map(element, mapSettings);
map.zoom(13);

// Create infoBubble library. Adds tabs to the info bubbles on the markers
var infoBubble = new InfoBubble({
    maxWidth: 300
});


infoBubble.addTab('Wikipedia','No Wikipedia Content found.');
infoBubble.addTab('Street View','Street View not found for this area.');

// the model
var places = [
    { id:  1, placename: 'Veterans Park' ,map: map.gMap, position: { lat: 41.7125, lng: -81.349 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 },
    { id:  2, placename: 'Lost Nation Airport' ,map: map.gMap, position: { lat: 41.6850, lng: -81.388 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 },
    { id:  3, placename: 'Great Lakes Mall' ,map: map.gMap, position: { lat: 41.6560, lng: -81.362 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 },
    { id:  4, placename: 'James A. Garfield' ,map: map.gMap, position: { lat: 41.6650, lng: -81.351 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 },
    { id:  5, placename: 'Lake Erie' ,map: map.gMap, position: { lat: 41.7125, lng: -81.388 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 },
    { id:  6, placename: 'Mentor Marsh State Nature Preserve' ,map: map.gMap, position: { lat: 41.7349, lng: -81.315 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 },
    { id:  7, placename: 'Headlands Beach State Park' ,map: map.gMap, position: { lat: 41.7560, lng: -81.290 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }


];



// Marker creation
var Place = function(place) {
    place.placename = ko.observable(place.placename);
    place.selected = ko.observable(place.selected);
    //alert('place.selected: ' + place.placename);
    var marker = new google.maps.Marker(place);
    if (map.markerCluster) {
        map.markerCluster.addMarker(marker);
    }
    return marker;
};

// ViewModel
var ViewModel = function(){
    var self = this;
    self.list = ko.observableArray([]);

    // Create and bind markers using the "places" array
    places.forEach(function(place){
        var marker = new Place(place);
        //alert('adding marker: ' + marker.placename);
        // Add an event listener using a closure
        google.maps.event.addListener(marker, 'click', (function(Copy) {
            return function() {
                self.setCurrentPlace(Copy);
            };
        })(marker));
        self.list().push(marker);
    });
    // Ajax call to Wikipedia
    self.wikiCall = function(data){

        var wikiTimeOut = setTimeout(function(){
            infoBubble.updateTab(0, '<div class="infoBubble">Wikipedia</div>', "So sorry, the request to Wikipedia has failed");
            infoBubble.updateContent_();
        }, 8000);
        $.ajax({
            url: "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&limit=10&search="+data.placename(),
            type: 'POST',
            dataType: "jsonp",
            success: function( response ) {
                var articleTitle = response[1];
                var articleLink = response[3];
                var result = [];
                for (var i = 0; i < articleTitle.length; i++){
                    var title = articleTitle[i];
                    var link = articleLink[i];
                    result.push('<li><a href="'+link+'"target="_blank">'+title+'</a></li>');
                }
                var contentString = result.join('');
                clearTimeout(wikiTimeOut);
                infoBubble.updateTab(0,'<div class="infoBubble">Wikipedia</div>',contentString);
                infoBubble.updateContent_();
            }
        });
    };
    // Google Maps Street View
    self.streetView = function(data){
        var img = data.position.A + "," + data.position.F;
        //alert('streetimg: ',img);
        var contentString = '<img class="bgimg" alt="Sorry, the image failed to load." src="https://maps.googleapis.com/maps/api/streetview?size=600x300&location='+img+'">';
        //var url = 'https://maps.googleapis.com/maps/api/streetview?size=600x300&location=' + theAddress;
        infoBubble.updateTab(1,'<div class="infoBubble">Street View</div>',contentString);
        infoBubble.updateContent_();
    };
    // Set the pin to the location selected
    self.setCurrentPlace = function(data){
        self.list().forEach(function(data){
            data.setIcon(null);
            data.selected(null);
        });
        data.setIcon(iconSelected);
        data.selected(1);
        self.currentPlace(data);
        self.wikiCall(data);
        //alert(data.position.A);
        self.streetView(data);
        infoBubble.open(map.gMap, data);
        return true;
    };
    self.currentPlace = ko.observable( this.list()[0] );
    self.searchBox = ko.observable("");

    self.searchPlaces = ko.computed(function() {
            if(self.searchBox() === "") {
                return self.list();
            } else {
                return ko.utils.arrayFilter(self.list(), function(item) {
                    return item.placename().toLowerCase().indexOf(self.searchBox().toLowerCase())>-1;
                });
            }
        });

    self.computedPlaces = ko.computed(function() {
        return ko.utils.arrayFilter(self.list(), function(item) {
            var showItem = item.placename().toLowerCase().indexOf(self.searchBox().toLowerCase()) >= 0;
            //alert(showItem);
            if (item.marker){
                if (showItem) {
                    //alert('showItem is true');
                    item.marker.setMap(Map);
                } else {
                    //alert('showItem is false');
                    item.marker.setMap(null);
                }
            }
            return showItem;
        });
    });

};
ko.applyBindings(new ViewModel());
