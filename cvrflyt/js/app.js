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
  }
}


var contoller = {
  init: function() {
    view.init()
  },
  data: function(komkode) {
    return model.getData(komkode)
  }
}


var view = {
  init: function() {
    this.clickDropdownItem();

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
          window.open("https://datacvr.virk.dk/data/visenhed?enhedstype=virksomhed&id=" + item.item.virksomhed_cvrnr, '_blank');
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

  }
}
