$(function() {
    $('#scrollbar-vert').scrollbar($('#flexible-scrollbar-target-vert'));
    $('#scrollbar-horiz').scrollbar($('#flexible-scrollbar-target-horiz'), true);
    $('#scrollbar-vert-distant').scrollbar($('#flexible-scrollbar-target-vert-distant'));
    $('#scrollbar-vert-style').scrollbar($('#flexible-scrollbar-target-vert-style'));
    $('#increase-inner').on('click', function() {
        $('.red').removeClass('hidden');
    });
    $('#decrease-inner').on('click', function() {
        $('.red').addClass('hidden');
    });
    $('#increase').on('click', function() {
        $('#flexible-scrollbar-target-vert').addClass('big');
        $('#flexible-scrollbar-target-horiz').addClass('big');

        $('#scrollbar-vert').addClass('big');
        $('#scrollbar-horiz').addClass('big');

        $('#default-browser-vert').addClass('big');
        $('#default-browser-horiz').addClass('big');
    });
    $('#decrease').on('click', function() {
        $('#flexible-scrollbar-target-vert').removeClass('big');
        $('#flexible-scrollbar-target-horiz').removeClass('big');

        $('#scrollbar-vert').removeClass('big');
        $('#scrollbar-horiz').removeClass('big');

        $('#default-browser-vert').removeClass('big');
        $('#default-browser-horiz').removeClass('big');
    });
});
