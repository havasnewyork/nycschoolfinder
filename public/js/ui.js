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

		$.each(data.matches, function(i, school) {
			var li = $('<li/>')
					.text(school.school_name)
					.appendTo(schoolsList);
			var traitsText = [];
			$.each(school.traits, function(j, trait) {
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
					.text(personality.name + " (" + (personality.percentage*100).toFixed(2) + "%)")
					.appendTo(personalitiesList);
		});
	}

	function initializeMap() {
		var mapCanvas = document.getElementById('map-canvas');
		var mapOptions = {
			center: new google.maps.LatLng(40.7401, -73.8694),
			zoom: 11,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		var map = new google.maps.Map(mapCanvas, mapOptions)
	}
	google.maps.event.addDomListener(window, 'load', initializeMap);

})();
