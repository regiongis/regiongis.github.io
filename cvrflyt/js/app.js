//global array to store ajax data
var data = [];
var kommuner = [];
var csv;

var model = {
  //get company movingpattern/changes within municipality
  cvr: function(komkode) {
    var url = "https://drayton.mapcentia.com/api/v1/sql/ballerup?q=SELECT * FROM cvr.flyttemoenster("  + komkode + ")"
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
    this.ajaxLoading();
    $("#csv").hide()
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
