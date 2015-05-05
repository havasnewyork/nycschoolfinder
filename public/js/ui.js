(function() {

	$('#pasteCorpusLink').click(showPasteCorpus);
	$('#results').css('display', 'none').css('opacity', '0');
	$('#moreInfo').css('display', 'none').css('opacity', '0');
	$('#results').on('resultsReady', showResults);


	function showPasteCorpus() {
		$('#pasteCorpus').css('display', 'block');
	}

	function showResults() {
		$('#personalityEntry .collapse').collapse();
		$('#results').css('display', 'block').css('opacity', '1');
		$('#moreInfo').css('display', 'block').css('opacity', '1');

		formatResults($('#results').data("schools"));
	}

	function formatResults(data) {
		var schoolsList = $('#results .schools');
		var personalitiesList = $('#moreInfo .personalities');

		$.each(data.matches.sort(function(a,b) {return b.score - a.score}), function(i, school) {
			var li = $('<li/>')
					.text(school.school_name)
					.appendTo(schoolsList);
			var traitsText = [];
			$.each(school.traits.sort(function(a,b) {return b.percentage - a.percentage}), function(j, trait) {
				if (trait.percentage > 0.75) {
					traitsText.push(trait.name/* + " (" + (trait.percentage*100).toFixed(2) + "%)"*/);
				}
			});
			var info = $('<p/>')
						.text("Personality: "+traitsText.join(', '))
						.appendTo(li);
		});

		$.each(data.studentPersonality, function(i, personality) {
			var li = $('<li/>')
					.appendTo(personalitiesList);
			var sliderWidth = 5; // percents
			var sliderStart = personality.percentage*100-sliderWidth/2;
			var sliderEnd = personality.percentage*100+sliderWidth/2;
			var sliderColour = "rgba(30, 100, 220, 0.5)";
			console.log(sliderStart);
			var item = $('<span/>')
					.text(personality.name/* + " (" + (personality.percentage*100).toFixed(2) + "%)"*/)
					.addClass('personalityScale')
					.addClass(personality.name)
					.css('background', 'linear-gradient(to right, transparent '+sliderStart+'%, '+sliderColour+' '+sliderStart+'%, '+sliderColour+' '+sliderEnd+'%, transparent '+sliderEnd+'%)')
					.appendTo(li);
		});

		if (data.tradeoff) initTradeoff(data.tradeoff);

	}

	var taClient;
	function initTradeoff(tradeoffData) {
		taClient = new TradeoffAnalytics({
		      dilemmaServiceUrl: tradeoffData,
		      customCssUrl: 'https://ta-cdn.mybluemix.net/modmt/styles/watson.css',
		      profile: 'basic',
		      errCallback: function(err){
		      	console.log('tradeoff init error:', err);
		      }
		    }, 'taWidgetContainer');

		    taClient.start(callback);
	}

	function initializeMap() {
		var mapCanvas = document.getElementById('map-canvas');
		var mapOptions = {
			center: new google.maps.LatLng(40.7401, -73.8694),
			zoom: 11,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		var map = new google.maps.Map(mapCanvas, mapOptions)

		var styles = [
		    {
		        "featureType": "administrative",
		        "elementType": "labels.text.fill",
		        "stylers": [
		            {
		                "color": "#444444"
		            }
		        ]
		    },
		    {
		        "featureType": "landscape",
		        "elementType": "all",
		        "stylers": [
		            {
		                "color": "#f2f2f2"
		            }
		        ]
		    },
		    {
		        "featureType": "poi",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "poi.school",
		        "elementType": "geometry.fill",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "poi.school",
		        "elementType": "geometry.stroke",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "poi.school",
		        "elementType": "labels.icon",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "road",
		        "elementType": "all",
		        "stylers": [
		            {
		                "saturation": -100
		            },
		            {
		                "lightness": 45
		            }
		        ]
		    },
		    {
		        "featureType": "road.highway",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "road.arterial",
		        "elementType": "labels.icon",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "transit",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "transit.line",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "water",
		        "elementType": "all",
		        "stylers": [
		            {
		                "color": "#466BB0"
		            },
		            {
		                "visibility": "on"
		            }
		        ]
		    }
		];
		map.setOptions({styles: styles});
	}
	google.maps.event.addDomListener(window, 'load', initializeMap);

})();
