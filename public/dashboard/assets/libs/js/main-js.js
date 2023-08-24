
jQuery(document).ready(function ($) {
    'use strict';

    // ============================================================== 
    // Notification list
    // ============================================================== 
    if ($(".notification-list").length) {

        $('.notification-list').slimScroll({
            height: '250px'
        });

    }

    // ============================================================== 
    // Menu Slim Scroll List
    // ============================================================== 


    // if ($(".menu-list").length) {
    //     $('.menu-list').slimScroll({

    //     });
    // }

    // ============================================================== 
    // Sidebar scrollnavigation 
    // ============================================================== 
    // console.log($(".sidebar-nav-fixed"))

    if ($(".sidebar-nav-fixed a").length) {
        $('.sidebar-nav-fixed a')
            // Remove links that don't actually link to anything

            .click(function (event) {
                // On-page links
                if (
                    location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') &&
                    location.hostname == this.hostname
                ) {
                    // Figure out element to scroll to
                    console.log(location.hostname, this.hostname)
                    var target = $(this.hash);
                    target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                    // Does a scroll target exist?
                    if (target.length) {
                        // Only prevent default if animation is actually gonna happen
                        event.preventDefault();
                        $('html, body').animate({
                            scrollTop: target.offset().top - 90
                        }, 1000, function () {
                            // Callback after animation
                            // Must change focus!
                            var $target = $(target);
                            $target.focus();
                            if ($target.is(":focus")) { // Checking if the target was focused
                                return false;
                            } else {
                                $target.attr('tabindex', '-1'); // Adding tabindex for elements not focusable
                                $target.focus(); // Set focus again
                            };
                        });
                    }
                };
                $('.sidebar-nav-fixed a').each(function () {
                    $(this).removeClass('active');
                })
                $(this).addClass('active');
            });

    }

    $(function () {
        setNavigation();
    });

    function setNavigation() {
        var path = window.location.pathname;
        path = path.replace(/\/$/, "");
        console.log($(location))
        path = decodeURIComponent(path);
        $("nav.navbar .navbar-nav a").each(function () {
            var href = $(this).attr('href');
            if (path === href) {
                $(this).closest('a.nav-link').addClass('active');
            }
        });
    }

    // ============================================================== 
    // tooltip
    // ============================================================== 
    if ($('[data-toggle="tooltip"]').length) {

        $('[data-toggle="tooltip"]').tooltip()

    }

    // ============================================================== 
    // popover
    // ============================================================== 
    if ($('[data-toggle="popover"]').length) {
        $('[data-toggle="popover"]').popover()

    }
    // ============================================================== 
    // Chat List Slim Scroll
    // ============================================================== 


    if ($('.chat-list').length) {
        $('.chat-list').slimScroll({
            color: 'false',
            width: '100%'


        });
    }
    // ============================================================== 
    // dropzone script
    // ============================================================== 

    //     if ($('.dz-clickable').length) {
    //            $(".dz-clickable").dropzone({ url: "/file/post" });
    // }

    $("#filterByTimeRangeOfFirstRow").change(function () {
        if ($("#filterByTimeRangeOfFirstRow option:selected").val() != "overall") {
            $("#overallSecondColumnFirstRow").removeClass("d-none");
            $("#overallThirdColumnFirstRow").removeClass("d-none");
            $("#pastOneWeekSecondColumnFirstRow").addClass("d-none");
            $("#pastOneWeekThirdColumnFirstRow").addClass("d-none");
            $("#pastOneMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastOneMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneYearSecondColumnFirstRow").addClass("d-none");
            $("#pastOneYearThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveYearSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveYearThirdColumnFirstRow").addClass("d-none");
        };
        if ($("#filterByTimeRangeOfFirstRow option:selected").val() == "pastOneWeekFirstRow") {
            $("#overallSecondColumnFirstRow").addClass("d-none");
            $("#overallThirdColumnFirstRow").addClass("d-none");
            $("#pastOneWeekSecondColumnFirstRow").removeClass("d-none");
            $("#pastOneWeekThirdColumnFirstRow").removeClass("d-none");
            $("#pastOneMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastOneMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneYearSecondColumnFirstRow").addClass("d-none");
            $("#pastOneYearThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveYearSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveYearThirdColumnFirstRow").addClass("d-none");
        };
        if ($("#filterByTimeRangeOfFirstRow option:selected").val() == "pastOneMonthFirstRow") {
            $("#overallSecondColumnFirstRow").addClass("d-none");
            $("#overallThirdColumnFirstRow").addClass("d-none");
            $("#pastOneMonthSecondColumnFirstRow").removeClass("d-none");
            $("#pastOneMonthThirdColumnFirstRow").removeClass("d-none");
            $("#pastOneWeekSecondColumnFirstRow").addClass("d-none");
            $("#pastOneWeekThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneYearSecondColumnFirstRow").addClass("d-none");
            $("#pastOneYearThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveYearSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveYearThirdColumnFirstRow").addClass("d-none");
        };
        if ($("#filterByTimeRangeOfFirstRow option:selected").val() == "pastFiveMonthsFirstRow") {
            $("#overallSecondColumnFirstRow").addClass("d-none");
            $("#overallThirdColumnFirstRow").addClass("d-none");
            $("#pastOneMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastOneMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneWeekSecondColumnFirstRow").addClass("d-none");
            $("#pastOneWeekThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthSecondColumnFirstRow").removeClass("d-none");
            $("#pastFiveMonthThirdColumnFirstRow").removeClass("d-none");
            $("#pastOneYearSecondColumnFirstRow").addClass("d-none");
            $("#pastOneYearThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveYearSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveYearThirdColumnFirstRow").addClass("d-none");
        };
        if ($("#filterByTimeRangeOfFirstRow option:selected").val() == "pastOneYearFirstRow") {
            $("#overallSecondColumnFirstRow").addClass("d-none");
            $("#overallThirdColumnFirstRow").addClass("d-none");
            $("#pastOneMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastOneMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneWeekSecondColumnFirstRow").addClass("d-none");
            $("#pastOneWeekThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneYearSecondColumnFirstRow").removeClass("d-none");
            $("#pastOneYearThirdColumnFirstRow").removeClass("d-none");
            $("#pastFiveYearSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveYearThirdColumnFirstRow").addClass("d-none");
        };
        if ($("#filterByTimeRangeOfFirstRow option:selected").val() == "pastFiveYearFirstRow") {
            $("#overallSecondColumnFirstRow").addClass("d-none");
            $("#overallThirdColumnFirstRow").addClass("d-none");
            $("#pastOneMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastOneMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneWeekSecondColumnFirstRow").addClass("d-none");
            $("#pastOneWeekThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthSecondColumnFirstRow").addClass("d-none");
            $("#pastFiveMonthThirdColumnFirstRow").addClass("d-none");
            $("#pastOneYearSecondColumnFirstRow").addClass("d-none");
            $("#pastOneYearThirdColumnFirstRow").addClass("d-none");
            $("#pastFiveYearSecondColumnFirstRow").removeClass("d-none");
            $("#pastFiveYearThirdColumnFirstRow").removeClass("d-none");
        };
    })


    $("#filterByTimeRangeOfThirdRow").change(function () {
        if ($("#filterByTimeRangeOfThirdRow option:selected").val() != "overall") {
            $("#overallSecondColumnThirdRow").removeClass('d-none');
            $("#pastOneWeekSecondColumnThirdRow").addClass('d-none')
            $("#pastOneMonthSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsSecondColumnThirdRow").addClass('d-none')
            $("#pastOneYearSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveYearSecondColumnThirdRow").addClass('d-none')
            $("#overallThirdColumnThirdRow").removeClass('d-none');
            $("#pastOneWeekThirdColumnThirdRow").addClass('d-none')
            $("#pastOneMonthThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsThirdColumnThirdRow").addClass('d-none')
            $("#pastOneYearThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveYearThirdColumnThirdRow").addClass('d-none')
        }
        if ($("#filterByTimeRangeOfThirdRow option:selected").val() == "pastOneWeekThirdRow") {
            $("#overallSecondColumnThirdRow").addClass('d-none');
            $("#pastOneWeekSecondColumnThirdRow").removeClass('d-none')
            $("#pastOneMonthSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsSecondColumnThirdRow").addClass('d-none')
            $("#pastOneYearSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveYearSecondColumnThirdRow").addClass('d-none')
            $("#overallThirdColumnThirdRow").addClass('d-none');
            $("#pastOneWeekThirdColumnThirdRow").removeClass('d-none')
            $("#pastOneMonthThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsThirdColumnThirdRow").addClass('d-none')
            $("#pastOneYearThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveYearThirdColumnThirdRow").addClass('d-none')
        }
        if ($("#filterByTimeRangeOfThirdRow option:selected").val() == "pastOneMonthThirdRow") {
            $("#overallSecondColumnThirdRow").addClass('d-none');
            $("#pastOneWeekSecondColumnThirdRow").addClass('d-none')
            $("#pastOneMonthSecondColumnThirdRow").removeClass('d-none')
            $("#pastFiveMonthsSecondColumnThirdRow").addClass('d-none')
            $("#pastOneYearSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveYearSecondColumnThirdRow").addClass('d-none')
            $("#overallThirdColumnThirdRow").addClass('d-none');
            $("#pastOneWeekThirdColumnThirdRow").addClass('d-none')
            $("#pastOneMonthThirdColumnThirdRow").removeClass('d-none')
            $("#pastFiveMonthsThirdColumnThirdRow").addClass('d-none')
            $("#pastOneYearThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveYearThirdColumnThirdRow").addClass('d-none')
        }
        if ($("#filterByTimeRangeOfThirdRow option:selected").val() == "pastFiveMonthsThirdRow") {
            $("#overallSecondColumnThirdRow").addClass('d-none');
            $("#pastOneWeekSecondColumnThirdRow").addClass('d-none')
            $("#pastOneMonthSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsSecondColumnThirdRow").removeClass('d-none')
            $("#pastOneYearSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveYearSecondColumnThirdRow").addClass('d-none')
            $("#overallThirdColumnThirdRow").addClass('d-none');
            $("#pastOneWeekThirdColumnThirdRow").addClass('d-none')
            $("#pastOneMonthThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsThirdColumnThirdRow").removeClass('d-none')
            $("#pastOneYearThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveYearThirdColumnThirdRow").addClass('d-none')
        }
        if ($("#filterByTimeRangeOfThirdRow option:selected").val() == "pastOneYearThirdRow") {
            $("#overallSecondColumnThirdRow").addClass('d-none');
            $("#pastOneWeekSecondColumnThirdRow").addClass('d-none')
            $("#pastOneMonthSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsSecondColumnThirdRow").addClass('d-none')
            $("#pastOneYearSecondColumnThirdRow").removeClass('d-none')
            $("#pastFiveYearSecondColumnThirdRow").addClass('d-none')
            $("#overallThirdColumnThirdRow").addClass('d-none');
            $("#pastOneWeekThirdColumnThirdRow").addClass('d-none')
            $("#pastOneMonthThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsThirdColumnThirdRow").addClass('d-none')
            $("#pastOneYearThirdColumnThirdRow").removeClass('d-none')
            $("#pastFiveYearThirdColumnThirdRow").addClass('d-none')
        }
        if ($("#filterByTimeRangeOfThirdRow option:selected").val() == "pastFiveYearThirdRow") {
            $("#overallSecondColumnThirdRow").addClass('d-none');
            $("#pastOneWeekSecondColumnThirdRow").addClass('d-none')
            $("#pastOneMonthSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsSecondColumnThirdRow").addClass('d-none')
            $("#pastOneYearSecondColumnThirdRow").addClass('d-none')
            $("#pastFiveYearSecondColumnThirdRow").removeClass('d-none')
            $("#overallThirdColumnThirdRow").addClass('d-none');
            $("#pastOneWeekThirdColumnThirdRow").addClass('d-none')
            $("#pastOneMonthThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveMonthsThirdColumnThirdRow").addClass('d-none')
            $("#pastOneYearThirdColumnThirdRow").addClass('d-none')
            $("#pastFiveYearThirdColumnThirdRow").removeClass('d-none')
        }
    })



    $("#filterByDevices").change(function () {

        $('.deviceWiseRow').map((index, element) => {
            if (!$('.details-row-' + index).hasClass('d-none')) {
                $('.details-row-' + index).addClass('d-none')
            }
            if ($('.deviceWiseRow').find(".details-" + index).find('i').hasClass('fa-chevron-up')) {
                $('.deviceWiseRow').find(".details-" + index).find('i').removeClass('fa-chevron-up').addClass('fa-chevron-down')
            }
            if ($('.deviceWiseRow').find('.details-' + index).hasClass('btn-primary')) {
                console.log($('.deviceWiseRow').find('.details-' + index))
                $('.deviceWiseRow').find('.details-' + index).removeClass('btn-primary')
            }
        })

        if ($("#filterByDevices option:selected").val() != "overall") {
            $('.notFaultyDevice').removeClass('d-none')
            $('.text-danger.faultyDevice').addClass('d-none')
            $('.text-warning.inactive').removeClass('d-none')
            $('.text-success.active').removeClass('d-none')
            $('.text-warning.inactive').closest('tr').removeClass('d-none')
            $('.text-success.active').closest('tr').removeClass('d-none')
            $(this).removeClass('text-success')
            $(this).removeClass('text-danger')
            $(this).removeClass('text-warning')
        }
        if ($("#filterByDevices option:selected").val() == "activeDevices") {
            $('.text-warning.inactive').closest('tr').addClass('d-none')
            $('.text-success.active').closest('tr').removeClass('d-none')
            $(this).addClass('text-success')
        }
        if ($("#filterByDevices option:selected").val() == "inactiveDevices") {
            $('.text-warning.inactive').closest('tr').removeClass('d-none')
            $('.text-success.active').closest('tr').addClass('d-none')
            $(this).addClass('text-warning')
        }
        if ($("#filterByDevices option:selected").val() == "faultyDevices") {
            $('.notFaultyDevice').addClass('d-none')
            $('.text-danger.faultyDevice').removeClass('d-none')
            $('.text-warning.inactive').addClass('d-none')
            $('.text-success.active').addClass('d-none')
            $(this).addClass('text-danger')
        }
    })
    $("#filterByUsers").change(function () {

        $('.usersWiseRow').map((index, element) => {
            if (!$('.details-row-' + index).hasClass('d-none')) {
                $('.details-row-' + index).addClass('d-none')
            }
            if ($('.usersWiseRow').find(".details-" + index).find('i').hasClass('fa-chevron-up')) {
                $('.usersWiseRow').find(".details-" + index).find('i').removeClass('fa-chevron-up').addClass('fa-chevron-down')
            }
            if ($('.usersWiseRow').find('.details-' + index).hasClass('btn-primary')) {
                console.log($('.usersWiseRow').find('.details-' + index))
                $('.usersWiseRow').find('.details-' + index).removeClass('btn-primary')
            }
        })

        if ($("#filterByUsers option:selected").val() != "overall") {
            $('.text-warning.inactive').closest('tr').removeClass('d-none')
            $('.text-success.active').closest('tr').removeClass('d-none')
            $('.text-danger.faultyUsers').closest('tr').removeClass('d-none')
            $(this).removeClass('text-success')
            $(this).removeClass('text-danger')
            $(this).removeClass('text-warning')
        }
        if ($("#filterByUsers option:selected").val() == "activeUsers") {
            $('.text-warning.inactive').closest('tr').addClass('d-none')
            $('.text-danger.faultyUsers').closest('tr').addClass('d-none')
            $('.text-success.active').closest('tr').removeClass('d-none')
            $(this).addClass('text-success')
        }
        if ($("#filterByUsers option:selected").val() == "inactiveUsers") {
            $('.text-warning.inactive').closest('tr').removeClass('d-none')
            $('.text-danger.faultyUsers').closest('tr').addClass('d-none')
            $('.text-success.active').closest('tr').addClass('d-none')
            $(this).addClass('text-warning')
        }
        if ($("#filterByUsers option:selected").val() == "faultyUsers") {
            $('.text-warning.inactive').closest('tr').addClass('d-none')
            $('.text-danger.faultyUsers').closest('tr').removeClass('d-none')
            $('.text-success.active').closest('tr').addClass('d-none')
            $(this).addClass('text-danger')
        }
    })

});