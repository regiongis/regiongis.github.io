//global variable to store ajax data
var data;

var model = {
  getData: function(komkode) {
    var url = "https://drayton.mapcentia.com/api/v1/sql/ballerup?q=SELECT * FROM cvr.flyttemoenster("  + komkode + ")"
    return $.ajax({
      url: url,
      type: 'GET',
      dataType: 'jsonp',
      success: function(response) {
        data = response;
      }
    });
  },
  getKommuner: function() {
    var url = "https://drayton.mapcentia.com/api/v1/sql/ballerup?q=select right(komkode, 3)::int komkode, komnavn from data.kommune group by komkode, komnavn order by komkode"
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'jsonp',
      success: function(response) {
        var kommuner = [];
        $.each(response.features, function(index, el) {
          kommuner.push(response.features[index].properties);
        });
        console.log(kommuner);
      }
    });
  }
}


var contoller = {
  init: function() {
    view.init();
    this.jsonToCsv();
    model.getKommuner();
  },
  data: function(komkode) {
    return model.getData(komkode)
  },
  jsonToCsv: function(objArray) {
    console.log('terst');
  }
}



var view = {
  init: function() {
    this.clickDropdownItem();
    this.ajaxLoading();

  },
  clickDropdownItem: function() {
    $( "#151" ).click(function() {
      view.renderTable(151);
      $("#dropdownMenuButton").text('Ballerup')
    });
    $( "#240" ).click(function() {
      view.renderTable(240);
      $("#dropdownMenuButton").text('Egedal')
    });
    $( "#169" ).click(function() {
      view.renderTable(169);
      $("#dropdownMenuButton").text('Høje Taastrup')
    });
    $( "#159" ).click(function() {
      view.renderTable(159);
      $("#dropdownMenuButton").text('Gladsaxe')
    });
    $( "#183" ).click(function() {
      view.renderTable(183);
      $("#dropdownMenuButton").text('Ishøj')
    });
  },

  renderTable: function(komkode) {
    var dataArray = [];
    contoller.data(komkode).done(function() {
      $.each(data.features, function(index, el) {
        dataArray.push(el.properties);
      });

      $("#jsGrid").jsGrid({
        width: "100%",
        height: "100%",

        sorting: true,

        data: dataArray,

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
    });
  },
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
