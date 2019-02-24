

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
        close_popup();
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
var set_account_status = function(status){
    $('#account_status').text(status);
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

function popup(content, width){
    if(width == undefined){
        width = 400;
    }
    $("#popup_container").css("width", width+"px");
    $('#popup_background').show();
    $('#popup_outer').show();
    $('#popup_content').html(content)
}
function close_popup(){
    $('#popup_background').hide();
    $('#popup_outer').hide();
    $('#popup_content').html("")
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

function switchToPage(pageId){
    if($(pageId).length > 0) {
        $('.page').removeClass('active');
        $(pageId).addClass('active');
    }
}