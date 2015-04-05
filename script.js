$(function() {
    $('#scrollbar').scrollbar($('#first-container'));
    $('#increase').on('click', function() {
        $('p.hidden').removeClass('hidden');    
    });
});