/*global $*/
$(document).ready(function() {
   $('#searchForm').submit(function(ev) {
      ev.preventDefault();
      var searchText = $('#inputSearch').val();
      if (searchText) {
          window.location.href= window.location.pathname + "?$filter=indexof(familyName, '" + searchText + "' ) ge 0 or  indexof(givenName, '" + searchText + "' ) ge 0";    
      }
      else {
          window.location.href= window.location.pathname;
      }
   });
});