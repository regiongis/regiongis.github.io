//global variables
var data = [];
var tabledata = []
var kommuner = [];
var csv;
var mymap;
var geojsonLayer;
var kom;
var startDate;
var endDate;

////////////////////////////////////////////
///////////////// MODEL ////////////////////
////////////////////////////////////////////

var model = {
  //get company movingpattern/changes within municipality
  cvr: function(komkode, startDate, endDate) {
    var url = "https://drayton.mapcentia.com/api/v1/sql/ballerup?q=SELECT * FROM cvr.flyt_geojson("  + komkode + ",'" + startDate.format('YYYY-MM-DD') + "','" + endDate.format('YYYY-MM-DD') + "')&srs=4326"
    //returning ajax object for done method in controller
    return $.ajax({
      url: url,
      type: 'GET',
      dataType: 'jsonp',
      success: function(response) {
        $.each(response.features, function(index, feature) {
          //add data to global data array
          data.push(feature);
        });
      }
    });
  },
  //get municipality code and name
  kommuner: function() {
    var url = "https://drayton.mapcentia.com/api/v1/sql/ballerup?q=select right(komkode, 3)::int komkode, komnavn from data.kommune group by komkode, komnavn order by komnavn"
    return $.ajax({
      url: url,
      type: 'GET',
      dataType: 'jsonp',
      success: function(response) {
        $.each(response.features, function(index, _) {
          kommuner.push(response.features[index].properties);
        });
      }
    });
  },
  // Set dates 
  dates: function() {
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth();
    var firstDay = new Date(y, m, 1);
    startDate = moment(firstDay).subtract(1, 'month');
    endDate = moment(firstDay);
  }
}


///////////////////////////////////////////
/////////////// CONTROLLER ////////////////
///////////////////////////////////////////

var controller = {
  init: function() {
    this.getKommuner();
    model.dates();
    view.init();
  },

  getCvr: function(komkode, startDate, endDate) {
    //emptying array
    data = [];
    model.cvr(komkode, startDate, endDate).done(function() {
      view.renderTable();
      controller.csv();
      view.downloadCsv();
      view.afterAjax();
    });
  },

  getKommuner: function() {
    model.kommuner().done(function() {
      view.createDropdown(kommuner);
    });
  },
  //JSON to csv
  csv: function() {
    csv = Papa.unparse(tabledata)
  }
}


////////////////////////////////////////////
///////////////// VIEW ////////////////////
///////////////////////////////////////////

var view = {
  init: function() {
    this.ajaxLoading();
    this.beforeAjax();
  },

  //create dropdown items from municipality list
  createDropdown: function(kommuner) {
    $.each(kommuner, function(index, el) {
      var komkode = kommuner[index].komkode
      var komnavn = kommuner[index].komnavn
      $(".dropdown-menu")
        .append('<a class="dropdown-item" href="#" id="' + komkode + '">' + komnavn + "</a>")
      $("#" + komkode).click(function() {
        kom = komkode
        controller.getCvr(komkode, startDate, endDate);
        $("#dropdownMenuButton").text(komnavn);
      });
    });
  },

  datePicker: function() {
    $('input[name="daterange"]').daterangepicker({
      startDate: startDate,
      endDate: endDate,
      minDate: '02/01/2017',
      locale: {
        format: 'DD/M-YYYY',
        cancelLabel: 'Annuller'
      }
    }, function(start, end, label) {
      startDate = start;
      endDate = end;
      controller.getCvr(kom, startDate, endDate);
    });

    $('#datepicker').val($('#datepicker').attr("placeholder"));

  },

  //download selected municipality data as csv
  downloadCsv: function() {
    $("#csv").show();
    //get selected municipality name for output csv-file
    var currentKom = $("#dropdownMenuButton").text()
    //create link for downloading csv
    $('#csv').click(function() {
      uriContent = "text/csv;charset=utf-8,%ef%bb%bf" + encodeURIComponent(csv);
      var download = $("<a>")
              .attr("href", 'data:' + uriContent)
              .attr("download", currentKom + '_produktionsenhed_flyttemoenster.csv')
              .appendTo("body")[0].click();
    });
  },

  //create jsqgrid table with selected cvr data from a municipality
  renderTable: function() {
    //empty table data
    tabledata = []

    // Prepare data for table
    $.each(data, function( _, value ) {
      tabledata.push(value.properties);
    });

    $("#jsGrid").jsGrid({
      width: "100%",

      sorting: true,

      data: tabledata,

      rowClick: function(item) {
        window.open("https://datacvr.virk.dk/data/visenhed?enhedstype=produktionsenhed&id=" + item.item["p-nummer"], '_blank');
      },

      fields: [
        { name: "status", type: "text", title: "Status" },
        { name: "cvr-nummer", type: "number", title: "CVR nummer" },
        { name: "p-nummer", type: "number", title: "P nummer" },
        { name: "hovedbranche", type: "text", title: "Branche" },
        { name: "navn", type: "text", title: "Virksomhedsnavn" },
        { name: "kommunekode", type: "number", title: "Kommunekode" },
        { name: "vejnavn", type: "text", title: "Vejnavn" },
        { name: "husnummer", type: "text", title: "Husnummer" },
        { name: "postnummer", type: "number", title: "Postnummer" },
        { name: "postdistrikt", type: "text", title: "By" },
        { name: "emailadresse", type: "text", title: "Email" },
        { name: "indlæst dato", type: "text", title: "Indlæst dato" }
      ]
    });
  },

  //create map
  renderMap: function() {

    mymap = L.map('mapid').setView([55.2, 12.2], 7);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'baffioso.ie1ok8lg',
        accessToken: 'pk.eyJ1IjoiYmFmZmlvc28iLCJhIjoiT1JTS1lIMCJ9.f5ubY91Bi42yPnTrgiq-Gw'
    }).addTo(mymap);
  },

  // adding markers
  renderMarkers: function() {
    //select marker depending on status
    var costumIcon = function(status) {
      function selector(status) {
        switch (status) {
          case 'Tilflytter':
            return "img/t.png";
            break;
          case 'Fraflytter':
            return "img/f.png";
            break;
          case 'Nystartet':
            return "img/n.png";
            break;
          case 'Ophørt':
            return "img/o.png";
            break;
          default:
            break;
        }
      }
      return L.icon({
        iconUrl: selector(status),
        shadowUrl: 'img/shadow.png',
        iconAnchor: [16, 37],
        shadowAnchor: [20, 35],
        popupAnchor: [0, -30]
      });
    }
    //check if there is markers on the map and remove
    if (geojsonLayer != undefined ) {
      mymap.removeLayer(geojsonLayer);
    }
    
    function onEachFeature(feature, layer) {
      layer.bindPopup("<strong>" + feature.properties.status + '</strong></br><hr>' + feature.properties.navn + '</br><a href="https://datacvr.virk.dk/data/visenhed?enhedstype=produktionsenhed&id=' + feature.properties["p-nummer"] + '" target="_blank">Se mere her</a>');
    }
        
    geojsonLayer = L.geoJSON(data, {
      onEachFeature: onEachFeature,
      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, {icon: costumIcon(feature.properties.status)});
    },
    }).addTo(mymap);

    mymap.fitBounds(geojsonLayer.getBounds());
  },

  //showing loading-gif when ajax is runnung
  ajaxLoading: function() {
    $body = $("body");
    $(document).on({
        ajaxStart: function() {
            $body.addClass("loading");
        },
        ajaxStop: function() {
            $body.removeClass("loading");
        }
    });
  },

  // DOM manipulation fired when document is ready
  beforeAjax: function(){
    this.datePicker()

    $("#csv").hide();
    $("#table-map").hide();
    //ugly hack for rendering map in tab pane
    $("#rendermap").click(function() {
      setTimeout(function(){
        if (mymap == undefined ) {
          view.renderMap();
        }
        view.renderMarkers();
      }, 200);
    });
  },

  // DOM manipulation fired after AJAX
  afterAjax: function() {
    $(".navbar-text").remove();
    $('#csv').tooltip();
    //view logic dependent on ajax
    $("#table-map").show();
    if ( $("#rendermap").attr('class') == "nav-link active" ) {
      view.renderMarkers();
    }
  }
}
