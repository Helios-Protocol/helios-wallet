function getPageSize(){
  var pageSizeIndicator = document.getElementById('page-size-indicator');
  var style = getComputedStyle(pageSizeIndicator);
  var pageSize = style.width;
  if(pageSize === "0px")
    return 0;
  if(pageSize === "1px")
    return 1;
  else if(pageSize === "2px")
    return 2;
  else if(pageSize === "3px")
    return 3;
  else
    return -1;
}

var headerHeightMobile = 80;
var headerHeightDesktop = 80;
var currentPageSize = 0;

$(document).ready(function(){
    currentPageSize = getPageSize()

    $('.nav-button').click(function(){
        if(getPageSize() == 3)
            return;



        if($('header').get(0).style.height != '100%'){
            $('header').animate({height: '100%'}, 400);
            $('.header-container').animate({height: '100%'}, 400);
            $('.nav').show();
            // $('nav').show();
            $('html').addClass('no-doc-overflow');
        }
        else {
            $('header').animate({height: headerHeightMobile}, 400);
            $('.header-container').animate({height: headerHeightMobile}, 400, function(){
                // $('nav').hide();
            });
            $('html').removeClass('no-doc-overflow');

        }
    });

    $('.has_submenu').click(function () {
        if(getPageSize() == 3)
            return;
        $('.has_submenu').not($(this)).children('.nav__dropdown').removeClass('nav__dropdown--open')
        $('.has_submenu').not($(this)).children('.nav__dropdown').slideUp();
        $(this).children('.nav__dropdown').slideToggle();
        $(this).children('.nav__dropdown').addClass('nav__dropdown--open')
    });

    window.onhashchange = function() {
        goToHashFromURL();
    }

    $('.nav__item').not('.has_submenu').click(function(){
        $('header').animate({height: headerHeightMobile}, 400);
        $('.header-container').animate({height: headerHeightMobile}, 400, function(){
            // $('nav').hide();
        });
        $('html').removeClass('no-doc-overflow');
    });
    

});

$(window).on('load', function(){
    goToHashFromURL();
});

$(window).on('resize', function(){
    if(getPageSize() == 3) {
        if(currentPageSize != 3) {
          $('header').css('height', headerHeightDesktop);
          $('.header-contianer').css('height', headerHeightDesktop);
          $(".nav__dropdown").removeClass('nav__dropdown--open');
          $('.nav__dropdown').css('display', '');
          $('html').removeClass('no-doc-overflow');
          currentPageSize = 3;
        }
    }
    else {
        if(currentPageSize == 3) {
          $('header').css('height', headerHeightMobile);
          $('.header-contianer').css('height', headerHeightMobile);
          currentPageSize = getPageSize();
        }
    }

    positionPopup();
});


function goToHashFromURL()
{
	var hash = window.location.hash;
	//console.log(hash);
	if(hash != undefined){
	    if(hash == "" || hash == "#"){
	        //default tabs
	        switchToTab('frontpage-sign_in');
	        switchToTab('main_page-dashboard');
        }else {
            var name = hash.substring(1);
            switchToTab(name);
        }
    }

}

function switchToTab(name){
    if(name.indexOf('frontpage') !== -1){
        $('.frontpage_block_content').removeClass('active');
    }else if(name.indexOf('main_page') !== -1){
        $('.tab_item').removeClass('active');
    }

    var menu_item_id = "#" + name + "-menu_item";
    if ($(menu_item_id).length > 0) {
        $('.nav__item').removeClass('active');
        $(menu_item_id).addClass('active');
        $(menu_item_id).parents('.menu_root').addClass('active');
    }
    var tab_item_id = "#" + name;
    if ($(tab_item_id).length > 0) {
        $(tab_item_id).addClass('active');
    }
    if (name == 'historical_gas_price') {
        populateHistoricalMinGasPricePlot()
    }

}

function switchToPage(pageName){
    var pageId = "#" + pageName;
    if($(pageId).length > 0) {
        $('.page').removeClass('active');
        $(pageId).addClass('active');
    }
}