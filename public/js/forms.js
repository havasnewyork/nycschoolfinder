// adventure.js
// 


function resetForm(form) {
	form.css('opacity', 1);
	form.attr('disabled', false);
}

$(document).ready(function(){
	console.log('ok go:', $('form'));
	$('form').on('submit', function(evt){
		var form = $(this);
		if (form.attr('disabled')) return console.warn('form in progress STOP POSTING');
		form.attr('disabled', true);
		form.css('opacity', 0.5);
		evt.preventDefault();
		console.log(form, form.attr('method'), form.attr('action'))
		// all forms ajax
		var data = $( this ).serialize();

		var results = $('.results').html("Performing detailed complicated analysis...").addClass('loading');

		// console.log(data);
		$.ajax({
			method: form.attr('method'),
			url: form.attr('action'),
			data: data,
			success: function(data){
				console.log('form success:', data);
				$('.results').html(data);
				resetForm(form);
			},
			error: function(err) {
				console.log('form error:', data);
				resetForm(form);
			}
		})
	})


});