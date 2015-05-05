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
		var careersList = $('#moreInfo .careers');
		var personalitiesData = [];

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

		var mbti = "";
		$.each(data.studentPersonality, function(i, personality) {
			var li = $('<li/>')
					.appendTo(personalitiesList);
			var sliderWidth = 5; // percents
			var sliderStart = Math.max(0, personality.percentage*100-sliderWidth/2);
			var sliderEnd = Math.min(100, personality.percentage*100+sliderWidth/2);
			var sliderColour = "rgba(10, 190, 239, 0.5)";
			var item = $('<span/>')
					.text(personality.name/* + " (" + (personality.percentage*100).toFixed(2) + "%)"*/)
					.addClass('personalityScale')
					.addClass(personality.name)
					.css('background', 'linear-gradient(to right, transparent '+sliderStart+'%, '+sliderColour+' '+sliderStart+'%, '+sliderColour+' '+sliderEnd+'%, transparent '+sliderEnd+'%)')
					.appendTo(li);

			switch (personality.name) {
				case "Extraversion":
					mbti += personality.percentage > 0.5 ? 'E' : 'I';
					break;
				case "Openness":
					mbti += personality.percentage > 0.5 ? 'N' : 'S';
					break;
				case "Agreeableness":
					mbti += personality.percentage > 0.5 ? 'F' : 'T';
					break;
				case "Conscientiousness":
					mbti += personality.percentage > 0.5 ? 'J' : 'P';
					break;
			}
			personalitiesData.push([personality.name, personality.percentage*100]);

		});

		$.each(careers[sanitiseMbti(mbti)], function(i, career) {
			var li = $('<li/>')
					.text(career)
					.appendTo(careersList);
		});

		console.log(personalitiesData);

		var chart = c3.generate({
			bindto: '#charts',
			data: {
				columns: personalitiesData,
				type : 'pie'
			}
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

		    taClient.start();
	}

	function sanitiseMbti(value) {
		var sanitised = "";
		if (value.indexOf('E') >= 0) {
			sanitised += 'E';
		} if (value.indexOf('I') >= 0) {
			sanitised += 'I';
		} if (value.indexOf('N') >= 0) {
			sanitised += 'N';
		} if (value.indexOf('S') >= 0) {
			sanitised += 'S';
		} if (value.indexOf('F') >= 0) {
			sanitised += 'F';
		} if (value.indexOf('T') >= 0) {
			sanitised += 'T';
		} if (value.indexOf('J') >= 0) {
			sanitised += 'J';
		} if (value.indexOf('P') >= 0) {
			sanitised += 'P';
		}
		return sanitised;
	}

	var careers = { ISTJ: ["Business Executives, Administrators and Managers", "Accountants and Financial Officers", "Police and Detectives", "Judges", "Lawyers", "Medical Doctors / Dentists", "Computer Programmers or Systems Analysts", "Military Leaders"],
					ESTJ: ["Military leaders", "Business Administrators and Managers", "Police / Detective work", "Judges", "Financial Officers", "Teachers", "Sales Representatives"],
					ISFJ: ["Interior Decorators", "Designers", "Nurses", "Administrators and Managers", "Administrative Assistants", "Child Care / Early Childhood Development", "Social Work / Counselors", "Paralegals", "Clergy / Religious Workers", "Office Managers", "Shopkeepers", "Bookkeepers", "Home Economics"],
					ESFJ: ["Home Economics", "Nursing", "Teaching", "Administrators", "Child Care", "Family Practice Physician", "Clergy or other religious work", "Office Managers", "Counselors / Social Work", "Bookkeeping / Accounting", "Administrative Assistants"],
					ISTP: ["Police and Detective Work", "Forensic Pathologists", "Computer Programmers, System Analysts", "Engineers", "Carpenters", "Mechanics", "Pilots, Drivers, Motorcyclists", "Athletes", "Entrepreneurs"],
					ESTP: ["Sales Representatives", "Marketing Personnel", "Police / Detective Work", "Paramedic / Emergency Medical Technician", "PC Technicians or Network Cablers", "Computer Technical Support", "Entrepreneurs", "Athlete"],
					ESFP: ["Artists, Performers and Actors", "Sales Representatives", "Counselors / Social Work", "Child Care", "Fashion Designers", "Interior Decorators", "Consultants", "Photographers"],
					ISFP: ["Artist", "Musician / Composer", "Designer", "Child Care / Early Childhood Development", "Social Worker / Counselor", "Teacher", "Psychologist", "Veterinarian", "Forest Ranger", "Pediatrician"],
					ENTJ: ["Corporate Executive Officer; Organization Builder", "Entrepreneur", "Computer Consultant", "Lawyer", "Judge", "Business Administrators and Managers", "University Professors and Administrators"],
					INTJ: ["Scientists", "Engineers", "Professors and Teachers", "Medical Doctors / Dentists", "Corporate Strategists and Organization Builders", "Business Administrators / Managers", "Military Leaders", "Lawyers / Attorneys", "Judges", "Computer Programmers or Systems Analysts"],
					ENTP: ["Lawyers", "Psychologists", "Entrepreneurs", "Photographers", "Consultants", "Engineers", "Scientists", "Actors", "Sales Representatives", "Marketing Personnel", "Computer Programmer or Systems Analyst"],
					INTP: ["Scientists - especially Physics, Chemistry", "Photographers", "Strategic Planners", "Mathematicians", "University Professors", "Computer Programmers or Systems Analysts", "Technical Writers", "Engineers", "Lawyers / Attorneys", "Judges", "Forensic Research", "Forestry and Park Rangers"],
					ENFJ: ["Facilitator", "Consultant", "Psychologist", "Social Worker / Counselor", "Teacher", "Clergy", "Sales Representative", "Human Resources", "Manager", "Events Coordinator", "Sales Representative", "Politicians / Diplomats", "Writers"],
					INFJ: ["Clergy / Religious Work", "Teachers", "Medical Doctors / Dentists", "Alternative Health Care Practitioners, i.e. Chiropractor, Reflexologist", "Psychologists", "Psychiatrists", "Counselors and Social Workers", "Musicians and Artists", "Photographers", "Child Care / Early Childhood Development"],
					ENFP: ["Consultant", "Psychologist", "Entrepreneur", "Actor", "Teacher", "Counselor", "Politician / Diplomat", "Writer / Journalist", "Television Reporter", "Computer Programmer / Systems Analyst", "Scientist", "Engineer", "Artist"],
					INFP: ["Writers", "Counselors / Social Workers", "Teachers / Professors", "Psychologists", "Psychiatrists", "Musicians", "Clergy / Religious Workers"]
				};

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
