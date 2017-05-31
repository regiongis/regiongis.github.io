//global array to store ajax data
var data = [];
var kommuner = [];
var csv;
var mymap;
var markergroup;

var model = {
  //get company movingpattern/changes within municipality
  cvr: function(komkode) {
    var url = "https://drayton.mapcentia.com/api/v1/sql/ballerup?q=SELECT * FROM cvr.flyttemoenster_geom("  + komkode + ")"
    //returning ajax object for done method in controller
    return $.ajax({
      url: url,
      type: 'GET',
      dataType: 'jsonp',
      success: function(response) {
        $.each(response.features, function(index, el) {
          //add data to global data array
          data.push(el.properties);
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
  }
}


var contoller = {
  init: function() {
    view.init();
    this.getKommuner();
  },

  getCvr: function(komkode) {
    //emptying array
    data = [];
    model.cvr(komkode).done(function() {
      view.renderTable();
      contoller.csv();
      view.downloadCsv();
      //view logic dependent on ajax
      $("#table-map").show();
      if ( $("#rendermap").attr('class') == "nav-link active" ) {
        view.renderMarkers();
      }
    });
  },

  getKommuner: function() {
    model.kommuner().done(function() {
      view.createDropdown(kommuner);
    });
  },
  //JSON to csv
  csv: function() {
    csv = Papa.unparse(data)
  }
}


var view = {
  init: function() {

    //this.renderMap()
    this.ajaxLoading();
    $("#csv").hide();
    //$("#table-map").hide();
    //ugly hack for rendering map in tab
    $("#rendermap").click(function() {
      setTimeout(function(){
        if (mymap == undefined ) {
          view.renderMap();
        }
        view.renderMarkers();
      }, 200);
    });
  },

  //create dropdown items from municipality list
  createDropdown: function(kommuner) {
    $.each(kommuner, function(index, el) {
      var komkode = kommuner[index].komkode
      var komnavn = kommuner[index].komnavn
      $(".dropdown-menu")
        .append('<a class="dropdown-item" href="#" id="' + komkode + '">' + komnavn + "</a>")
      $("#" + komkode).click(function() {
        contoller.getCvr(komkode);
        $("#dropdownMenuButton").text(komnavn);
      });
    });
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

  //create jsqgrid table with selected cvr data
  renderTable: function() {
    $("#jsGrid").jsGrid({
      width: "100%",

      sorting: true,

      data: data,

      rowClick: function(item) {
        window.open("https://datacvr.virk.dk/data/visenhed?enhedstype=produktionsenhed&id=" + item.item.pnr, '_blank');
      },

      fields: [
        { name: "status", type: "text", title: "Status" },
        { name: "virksomhed_cvrnr", type: "number", title: "CVR nummer" },
        { name: "pnr", type: "number", title: "P nummer" },
        { name: "hovedbranche_tekst", type: "text", title: "Branche" },
        { name: "navn_tekst", type: "text", title: "Virksomhedsnavn" },
        { name: "kommune_kode", type: "number", title: "Kommunekode" },
        { name: "beliggenhedsadresse_vejnavn", type: "text", title: "Vejnavn" },
        { name: "belig_adresse_husnummerfra", type: "text", title: "Husnummer" },
        { name: "beliggenhedsadresse_postnr", type: "number", title: "Postnummer" },
        { name: "belig_adresse_postdistrikt", type: "text", title: "By" },
        { name: "email_kontaktoplysning", type: "text", title: "Email" },
        { name: "livsforloeb_startdato", type: "text", title: "Startdato" }
      ]
    });
  },

  renderMap: function() {
    mymap = L.map('mapid').setView([55.2, 12.2], 7);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'baffioso.ie1ok8lg',
        accessToken: 'pk.eyJ1IjoiYmFmZmlvc28iLCJhIjoiT1JTS1lIMCJ9.f5ubY91Bi42yPnTrgiq-Gw'
    }).addTo(mymap);
  },

  renderMarkers: function() {
    //select constum marker from status
    var costumIcon = function(status) {
      function selector(status) {
        switch (status) {
          case 'Tilflytter':
            return "../img/t.png";
            break;
          case 'Fraflytter':
            return "../img/f.png";
            break;
          case 'Nystartet':
            return "../img/n.png";
            break;
          case 'Ophørt':
            return "../img/o.png";
            break;
          default:
            break;
        }
      }

      return L.icon({
        iconUrl: selector(status),
        shadowUrl: '../img/shadow.png',

        iconAnchor: [16, 37],
        shadowAnchor: [20, 35],
        popupAnchor: [0, -30]
      });
    }


    //check if there is marker on the map
    if (markergroup != undefined ) {
      mymap.removeLayer(markergroup);
    }

    var markers = [];

    $.each(data, function(i, _) {
      var x = data[i].x
      var y = data[i].y
      var marker = L.marker([Number(y), Number(x)], {icon: costumIcon(data[i].status)})
        .bindPopup("<strong>" + data[i].status + '</strong></br>' + data[i].navn_tekst);

      markers.push(marker);
    });
    //Zoom to markers bounding box
    markergroup = new L.featureGroup(markers)
      .addTo(mymap);
    mymap.fitBounds(markergroup.getBounds());
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
  }
}
