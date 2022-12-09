$.fn.pageMe = function(opts) {
    var $this = this,
        defaults = {
            perPage: 7,
            showPrevNext: false,
            hidePageNumbers: false
        },
        settings = $.extend(defaults, opts);

    var listElement = $this;
    var perPage = settings.perPage;
    var children = listElement.children();
    var pager = $('.pager');

    // Vaciar listas
    var aux_id_pager = settings.pagerSelector;
    $(aux_id_pager + " li").remove();

    if (typeof settings.childSelector != "undefined")
        children = listElement.find(settings.childSelector);

    if (typeof settings.pagerSelector != "undefined")
        pager = $(settings.pagerSelector);

    var numItems = children.length;
    var numPages = Math.ceil(numItems / perPage);

    pager.data("curr", 0);

    if (settings.showPrevNext)
        $('<li class="mt-2 mb-0"><a href="#" class="prev_link">«</a></li>').appendTo(pager);

    var curr = 0;
    while (numPages > curr && (settings.hidePageNumbers == false)) {
        if (curr < 3) {
            $('<li class="mt-2 mb-0 page_tabla" style="display:block;"><a href="#" class="page_link">' + (curr + 1) + '</a></li>').appendTo(pager);
        } else {
            $('<li class="mt-2 mb-0 page_tabla" style="display:none;"><a href="#" class="page_link">' + (curr + 1) + '</a></li>').appendTo(pager);
        }
        curr++;
    }

    // Añadir puntos ...
    if (numPages > 3) {
        $('<li class="mt-2 mb-0 puntos_pager_fin" style="color:#ffff;"></li>').appendTo(pager);
    }

    if (settings.showPrevNext)
        $('<li class="mt-2 mb-0"><a href="#" class="next_link">»</a></li>').appendTo(pager);

    //pager.find('.page_link:first').addClass('page_link_active');
    pager.find('.prev_link').hide();
    if (numPages <= 1) {
        pager.find('.next_link').hide();
    }
    pager.children().eq(1).addClass("page_link_active");

    children.hide();
    children.slice(0, perPage).show();

    pager.find('li .page_link').click(function() {
        var clickedPage = $(this).html().valueOf() - 1;
        goTo(clickedPage, perPage);
        return false;
    });
    pager.find('li .prev_link').click(function() {
        previous();
        return false;
    });
    pager.find('li .next_link').click(function() {
        next();
        return false;
    });

    function previous() {
        var goToPage = parseInt(pager.data("curr")) - 1;

        var puntos = document.getElementsByClassName("puntos_pager_fin");

        if (puntos[0]) {
            var estado_lista = document.getElementsByClassName("page_tabla")[goToPage].style.display;
            if (estado_lista == "none") {
                document.getElementsByClassName("page_tabla")[goToPage].style.display = "block";
                document.getElementsByClassName("page_tabla")[goToPage + 3].style.display = "none";
            }
            if (goToPage < (numPages - 1)) {
                puntos[0].style.display = "block";
            } else {
                puntos[0].style.display = "none";
            }
        }
        goTo(goToPage);
    }

    function next() {
        goToPage = parseInt(pager.data("curr")) + 1;

        var puntos = document.getElementsByClassName("puntos_pager_fin");
        if (puntos[0]) {
            var estado_lista = document.getElementsByClassName("page_tabla")[goToPage].style.display;
            if (estado_lista == "none") {
                document.getElementsByClassName("page_tabla")[goToPage].style.display = "block";
                document.getElementsByClassName("page_tabla")[goToPage - 3].style.display = "none";
            }
            if (goToPage < (numPages - 1)) {
                puntos[0].style.display = "block";
            } else {
                puntos[0].style.display = "none";
            }
        }
        goTo(goToPage);
    }

    function goTo(page) {
        var table = document.getElementById("tabla");
        var tr = table.getElementsByTagName("tr");
        var cantidad = 0,
            array_tr = [];
        for (var i = 0; i < parseInt(window.estados_tabla.length); i++) {
            tr[i].style.display = "none";
            if (window.estados_tabla[i] == 1) {
                array_tr[cantidad] = tr[i];
                cantidad++;
            }
        }

        var inicio = page * perPage;
        var final;
        if ((parseInt(array_tr.length)) <= 10) {
            final = parseInt(array_tr.length);
        } else if ((parseInt(array_tr.length)) > 10) {
            if ((inicio + 10) < (parseInt(array_tr.length))) {
                final = inicio + 10;
            } else {
                final = inicio + ((parseInt(array_tr.length)) - inicio);
            }
        }
        for (var i = inicio; i < final; i++) {
            array_tr[i].style.display = "";
        }

        // Mostrar u ocultar boton de izquierda
        if (page >= 1)
            pager.find('.prev_link').show();
        else
            pager.find('.prev_link').hide();

        // Mostrar u ocultar boton de derecha
        var aux_numPages = Math.ceil(cantidad / 10);
        if (page < (aux_numPages - 1))
            pager.find('.next_link').show();
        else
            pager.find('.next_link').hide();

        pager.data("curr", page);
        pager.children().removeClass("page_link_active");
        pager.children().eq(page + 1).addClass("page_link_active"); // Añade la clase a la lista

        // Page link
        var page_link = document.getElementsByClassName("page_link");
        console.log("cantidad page link,", page_link.length)
        for (var i = 0; i < parseInt(page_link.length); i++) {
            page_link[i].style.display = "none";
        }
        var curr = 0;
        while (aux_numPages > curr) {
            if (curr < 3) {
                page_link[curr].style.display = "block";
            } else {
                page_link[curr].style.display = "block";
            }
            curr++;
        }
    }
};