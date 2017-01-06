/* global $, moment, inputmask */

'use strict';

$( '[data-toggle="tooltip"]' ).tooltip();
$( '[data-toggle="popover"]' ).popover();

function currentDate() {
  return Date('now');
}

var tripDate = $('.datetimepicker');
if (tripDate.length !== 0) {
  $('.datetimepicker__field').attr('type', 'hidden');
  $('.datetimepicker__icon').hide();

  $('.datetimepicker__field').datetimepicker({
    format: 'DD.MM.YYYY',
    minDate: currentDate(),
    defaultDate: currentDate(),
    useStrict: true,
    keepOpen: true,
    inline: true,
    sideBySide: true,
    allowInputToggle: true,
    locale: moment.locale('ru'),
  });
}

var phoneInput = $('[name="phone"]');
if (phoneInput.length !== 0) {
  phoneInput.inputmask({ mask: '+7 999 999-99-99', greedy: false });
}