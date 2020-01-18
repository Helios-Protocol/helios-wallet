$( document ).ready(function() {
    $('#two_factor_disable').click(function(){
        server.delete2FASecret()
        .then(function(response){
            if(response !== false && "success" in response) {
                //success
                var popup_content = "Two factor authentication disabled successfully.";
                popup(popup_content, 500);
                set_two_factor_authentication_status(false);
            }else{
                //fail
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        })
    });

    $('.generate_new_two_factor').click(function(){
        server.getNew2FASecret()
        .then(function(response){
            if(response !== false && "success" in response) {
                //success
                var popup_content = document.getElementById("popup_content_new_two_factor_authentication").innerHTML;

                //ensure correct
                popup(popup_content, 400);

                $('#two_factor_authentication_confirm_qr_code').attr('src', response['img_url']);
                $('#two_factor_authentication_confirm_secret').html(response['secret']);
            }else{
                //fail
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        })
    });

    $('body').on('submit', '#confirm_new_two_factor_authentication_secret', function (e) {
        e.preventDefault();
        var secret = $('#two_factor_authentication_confirm_secret').html();
        var code = $('#new_two_factor_authentication_code').val();
        server.save2FASecret(secret, code)
        .then(function(response){
            if(response !== false && "success" in response) {
                //success
                var popup_content = "Two factor authentication successfully enabled with new secret";
                popup(popup_content, 500);
                set_two_factor_authentication_status(true);
            }else{
                //fail
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        })

    });
});