(jQuery || django.jQuery)(document).ready(function($) {

$('#result_list tr td:nth-child(4)').each( function () {
    var $cell = $(this).addClass('stack-info');
    if (!!JSON) {
        var stack_info = JSON.parse($cell.text());
        $cell.html(
            '<a href="#" class="toggle">Toggle TraceKit information</a>' +
            '<pre>' +
                JSON.stringify(stack_info, null, 4) +
            '</pre>'
        );
    }
}).find('a.toggle').click( function (event) {
    $(this).parents('td').toggleClass('expanded');
});

});
