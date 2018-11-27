$( document ).ready(function() {

  function init_links(obj) {
    $(obj).click(function() {
      var url = this.pathname;

      $.get(url, function(data) {
        var title = $(data).filter("title").text();
        document.title = title;

        $("main").replaceWith($(data).find("main"));

        highlight_nav(url);
        init_main_links();
        form_order();

        history.pushState({}, title, url);
      });

      return false;
    });
  }

  function init_nav_links() {
    init_links($("li.nav-item a"));
  }

  function init_main_links() {
    init_links($("main a"));
  }

  function highlight_nav(pathname) {
    $("li.nav-item a").each(function() {
      $(this).removeClass("active");
      var url = this.pathname;

      if (pathname == "/" && url == "/") {
        $(this).addClass("active");
      } else if (pathname.indexOf(url) != -1 && url != "/") {
        $(this).addClass("active");
      }
    });
  }

  function form_order() {

    var tables = {
      "product_batches": {
        "order": [
          "id",
          "products_id",
          "date",
          "product_batch_product_packaging",
          "packaging_cost",
          "net_weight_required",
          "product_batch_ingredients",
          "ingredients_cost",
          "prepared_weight",
          "total_cost"
        ]
      }
    }

    for (var table in tables) {
      var form = $("form." + table);
      var length = tables[table].order.length;
      console.log(length);
      for (var i=length-1; i>=0; i--) {
        console.log(".form-group." + tables[table].order[i]);
        $(form).find(".form-group." + tables[table].order[i]).detach().prependTo(form);
      }
    }
  }

  init_nav_links();
  init_main_links();
  highlight_nav(window.location.pathname);
  form_order();
});
