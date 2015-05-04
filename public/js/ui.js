(function() {

	$('#pasteCorpusLink').click(showPasteCorpus);

	function showPasteCorpus() {
		$('#pasteCorpus').css('display', 'block');
	}


	function initialize() {
		var mapCanvas = document.getElementById('map-canvas');
		var mapOptions = {
			center: new google.maps.LatLng(40.7401, -73.8694),
			zoom: 11,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		var map = new google.maps.Map(mapCanvas, mapOptions)
	}
	google.maps.event.addDomListener(window, 'load', initialize);

})();
