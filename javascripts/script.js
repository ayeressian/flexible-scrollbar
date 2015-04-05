$(function() {
    $('#scrollbar-vert').scrollbar($('#flexible-scrollbar-target-vert'));
    $('#scrollbar-horiz').scrollbar($('#flexible-scrollbar-target-horiz'), true);
    $('#increase').on('click', function() {
        $('.hidden').removeClass('hidden');
    });
});
