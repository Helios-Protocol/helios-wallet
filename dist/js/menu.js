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

        $('html').toggleClass('no-doc-overflow');

        if($('header').get(0).style.height != '100%'){
            $('header').animate({height: '100%'}, 400);
            $('.header-container').animate({height: '100%'}, 400);
            $('.nav').show();
        }
        else {
            $('header').animate({height: headerHeightMobile}, 400);
            $('.header-container').animate({height: headerHeightMobile}, 400);
        }
    });

    $('.nav__header').click(function () {
        if(getPageSize() == 3)
            return;

        $('.nav__header').not($(this)).siblings('.nav__dropdown').removeClass('nav__dropdown--open')
        $('.nav__header').not($(this)).siblings('.nav__dropdown').slideUp();
        $(this).siblings('.nav__dropdown').slideToggle();
        $(this).siblings('.nav__dropdown').addClass('nav__dropdown--open')
    });

    $('.nav__link').click(function(){
        var hash = $(this).attr('href');
        var name = hash.substring(1);
	    switchToTab(name);
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
})


function goToHashFromURL()
{
	var hash = window.location.hash;
	//console.log(hash);
	if(hash != undefined && hash != ""){
	    var name = hash.substring(1);
	    switchToTab(name);
    }

}

function switchToTab(name){
    var menu_item_id = "#" + name + "_menu_item";
    if($(menu_item_id).length > 0){
        var tab_item_id = "#" + name + "_tab";
        $('.nav__item').removeClass('active');
        $('.tab_item').removeClass('active');
        $(menu_item_id).addClass('active');
        $(tab_item_id).addClass('active');
    }
}