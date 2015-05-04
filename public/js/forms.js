// adventure.js
// 

$(document).ready(function(){
	console.log('ok go:', $('form'));
	$('form').on('submit', function(evt){
		var form = $(this);
		evt.preventDefault();
		console.log(form, form.attr('method'), form.attr('action'))
		// all forms ajax
		var data = $( this ).serialize();
		console.log(data);
		$.ajax({
			method: form.attr('method'),
			url: form.attr('action'),
			data: data,
			success: function(data){
				console.log('form success:', data);
				form.replaceWith(data);
			},
			error: function(err) {
				console.log('form error:', data);
			}
		})
	})


});