loader_timeout = undefined;

$( document ).ready(function() {

    $('.fillable_input').each(function(){
        if($(this).val() == ''){
            $(this).removeClass('filled')
        }else{
            $(this).addClass('filled')
        }
    });

    $('.fillable_input').change(function() {
        if($(this).val() == ''){
            $(this).removeClass('filled')
        }else{
            $(this).addClass('filled')
        }
    });

    $('#send_transaction_advanced_options_link').click(function(){
         if($(this).hasClass('active')){
             $('#send_transaction_advanced_options_container').hide();
             $(this).removeClass('active');
             $('#send_block_submit').attr('value', "Send")

             //Need to clear any transactions they may have added
             clear_vars();
         }else{
             $('#send_transaction_advanced_options_container').show();
             $(this).addClass('active');
             $('#send_block_submit').attr('value', "Send Block With Transactions in List")
         }
    });



    $('#popup_background').click(function(){
        if(!$(this).hasClass("no_close")){
            close_popup();
        }
    })

    $('body').on('click', '#exit_popup_submit', function(e) {
        close_popup();
    });

    $('body').on('click', '#exit_popup', function(e) {
        close_popup();
    });


    resize_initial_background();

    $(window).on('resize', function(){
        resize_initial_background()
    });

});

var set_status = function(status){
    $('#current_status').text(status);
}
var set_account_status = function(address, name){
    if(name === undefined){
        $('#account_status').html('Sending from wallet<br>'+address);
    }else{
        $('#account_status').html('Sending from wallet<br>'+name+"<br>("+address+")");
    }

}
var set_balance_status = function(status){
    $('#balance_status').text(status);
}
var set_min_gas_price_status = function(status){
    $('#min_gas_price_status').text(status);
}

var set_connection_status = function(status, connected){
    if(connected){
        $('#connection_status_icon').attr('src', 'images/check_mark.png');
    }else{
        $('#connection_status_icon').attr('src', 'images/x.png');
    }
    $('#connection_status').text(status);
}

var set_username_status = function(username){
    $('#username_status').text(username);
}

function set_two_factor_authentication_status(tfa_enabled){
    if(tfa_enabled) {
        $('#two_factor_authentication_status').text('Enabled');
    }else{
        $('#two_factor_authentication_status').text('Disabled');
    }
}

function popup(content, width){
    if(width == undefined){
        width = 400;
    }
    $('#popup_background').removeClass("no_close");
    $("#popup_container").css("width", width+"px");
    $('#popup_content').html(content)
    $('#loader_container').hide();
    $('#popup_container').show();
    $('#popup_background').fadeIn(200);
    $('#popup_outer').fadeIn(200);
    $('#popup_container').data('width', width);
    positionPopup();
}

function popupTimeout(){
    popup("The operation has timed out. Check your connection and try again.");
}

function loaderPopup(content, width){
    if(width == undefined){
        width = 400;
    }
    if(width > ($(window).width()-80)){
        width = ($(window).width()-80);
    }
    $('#popup_background').addClass("no_close");
    $("#loader_container").css("width", width+"px");
    $('#popup_container').hide();
    $('#loader_container').show();
    $('#loader_content').html(content)
    $('#popup_background').fadeIn(200);
    $('#popup_outer').fadeIn(200);
    positionPopup();
    loader_timeout = setTimeout(popupTimeout, 10000);
}
function close_popup(){
    $('#popup_background').hide();
    $('#popup_outer').hide();
    $('#popup_content').html("")
    if(loader_timeout !== undefined){
        clearTimeout(loader_timeout);
    }
}

function resize_initial_background(){

    var window_width = $(window).width();
    var window_height = $(window).height()

    var window_aspect_ratio = window_width/window_height;

    var background_width = $('#frontpage_page_background_image').width();
    var background_height = $('#frontpage_page_background_image').height();

    var image_aspect_ratio = background_width/background_height;

    if(window_aspect_ratio > image_aspect_ratio){
        $('#frontpage_page_background_image').css('height', 'auto');
        $('#frontpage_page_background_image').css('width', '100%');
    }else{

        $('#frontpage_page_background_image').css('height', '100%');
        $('#frontpage_page_background_image').css('width', 'auto');
    }

}

function initOfflineMenu(){
    $('.online_menu_item').hide();
    $('.offline_menu_item').show();
}

function initOnlineMenu(){
    $('.online_menu_item').show();
    $('.offline_menu_item').hide();
}

function positionPopup(){
    var scroll = $("html").scrollTop();
    var popupWidth = $('#popup_container').width();
    var popupHeight = $('#popup_container').outerHeight();
    var loaderHeight = $('#loader_container').outerHeight();
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var initialWidth = $('#popup_container').data('width');
    if((windowWidth -80) < initialWidth){
        $('#popup_container').width((windowWidth -80));
    }
    var popup_top = scroll + (windowHeight-popupHeight)/2;
    var loader_top = scroll + (windowHeight-loaderHeight)/2;
    $('#popup_container').css('top', popup_top);
    $('#loader_container').css('top', loader_top);

}
