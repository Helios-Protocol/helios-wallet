$(document).ready(function () {
    main();
    $(".netselect").find("a").click(function () {
        var selected_network_id = $(this).data("id");
        var selectedtext = $(this).text();
        $(".networkidselect").text(selectedtext);
        if (connectionMaintainer.networkId !== selected_network_id) {
            set_connection_status("Connecting to network with id " + selected_network_id, false)
            connectionMaintainer.setNetworkIdAndReconnect(parseInt(selected_network_id));
        }
    });
    $('#incoming_transactions_accept').click(function (e) {
        if (sending_account == null) {
            alertify.error('Need to load a wallet to do this.');
            return
        }
        if (!connectionMaintainer.isConnected()) {
            alertify.error('Not connected to a node. Please check your internet connection and retry.');
            return;
        }
        receiveAnyIncomingTransactions(sending_account.address, true)
            .then(function () {
                clear_vars();
                setTimeout(refreshDashboard, 2000);
            })
    });
    // $(".sagar751").on("click", function () {
    //     $(".preloader").show();
    //     return true;
    // });
    $('body').on('click', '#switch_wallet_link , .switch_wallet_links', function () {
        $(".preloader").css("display", "block");
        setTimeout(() => {
            var keystoreq = $(this).data('keystore');
            var keystores = $(this).data('keystores');
            var password = sessionStorage.getItem("password");
            var wallet_name = $(this).data('name');
            var keys = web3.eth.accounts.decrypt(JSON.stringify(keystoreq), password, null, wallet_name);
            var wallet_address = keys.address;
            sending_account = keys;
            refreshDashboard();
            keys['wallet_id'] = keystores.wallet_id;
            keys['keystore'] = keystores.keystore;
            sessionStorage.setItem("enabled_wallet", JSON.stringify(keys));
            var note = "Wallet " + sending_account.address + " is now loaded.";
            $("#address_wallet_modal_note").text(note);
            $(".enable_wallet_modal_note").text(sending_account.address);
            $("#modal-enable-wallet").modal("show");
            setTimeout(() => {
                $(".preloader").css("display", "none");
            }, 2000)
        }, 100);
    });
    $('body').on('click', '#switch_wallet_link_local , .switch_wallet_links_local', function () {
        $(".preloader").css("display", "block");
        var keystore = $(this).data('keystore');
        sending_account = keystore;
        refreshDashboard();
        var wallet_name_short = keystore.address.substr(0, 15) + "...";
        set_account_status_local_offline(keystore.address, wallet_name_short);
        set_account_status_local(keystore.address, wallet_name_short);
        sessionStorage.setItem("enabled_wallet_local", JSON.stringify(keystore));
        sessionStorage.setItem("enabled_wallet", JSON.stringify(keystore));
        $(".enable_wallet_modal_note").text(sending_account.address);
        $("#modal-enable-wallet").modal("show");
        $(".preloader").css("display", "none");
    });

    $('#send_transaction_advanced_options_link').click(function () {
        if ($(this).hasClass('active')) {
            //$('#send_transaction_advanced_options_container').hide();
            $(this).removeClass('active');
            $("#send_block_pre_confirmation").removeClass("form2bind_opem");
            $('#send_block_submit').text("Send")
            //$('.send_block_submit').attr("id","send_block_submit");
            //Need to clear any transactions they may have added
            clear_vars();
        } else {
            //$('#send_transaction_advanced_options_container').show();
            $(this).addClass('active');
            $("#send_block_pre_confirmation").addClass("form2bind_opem");
            $('#send_block_submit').text("Send Block With Transactions in List");
        }
    });
    $('#add_transaction_form').submit(function (e) {
        e.preventDefault();
        if (sending_account == null) {
            $('#error_status').text('Need to load a wallet first')
            return
        }
        add_transaction_to_block_from_form();
    })
    $('#send_block_pre_confirmation').submit(function (e) {

        e.preventDefault();
        if (sending_account == null) {
            alertify.error('Need to load a wallet first.');
            return
        }
        if (!connectionMaintainer.isConnected()) {
            alertify.error('Need to be connected to a node to do this.');
            return
        }

        var is_advanced = $('#send_transaction_advanced_options_link').hasClass('active');

        if (!is_advanced) {
            //need to add the transaction first
            //the non advanced mode is only 1 tx. so lets clear any that might be sitting in the block from a previously cancelled attempt
            pending_send_transactions = [];
            if (!add_transaction_to_block_from_form()) {
                return false;
            }
        }

        if (pending_send_transactions === null || pending_send_transactions === undefined || pending_send_transactions.length == 0) {
            alertify.error("You need to have at least one transaction to do this.");
            return;
        }

        if (getSumPendingTransactionsCost().gt(web3.utils.toBN(current_hls_balance_in_wei))) {
            var required_cost = web3.utils.fromWei(web3.utils.toBN(getSumPendingTransactionsCost()), 'ether').toString();
            var hls_balance = web3.utils.fromWei(web3.utils.toBN(current_hls_balance_in_wei), 'ether').toString();
            alertify.error("You don't have enough HLS to cover the transactions and fees. " +
                "You have a balance of " + hls_balance + " But the transactions and fees add up to " + required_cost +
                "<br><br>If your balance is incorrect, try sending it again in a few moments.");
            return;
        }

        if (!checkPendingTransactionsGasPrice()) {
            alertify.error("One or more of your transactions does not meet the minimum gas price requirement. " +
                "The current minimum allowed gas price is " + current_min_gas_price);
            return;
        }
        if (!checkBlockGasLimit()) {
            alertify.error("Your transactions require more gas than the block gas limit. " +
                "Reduce the number of transactions in this block before sending again. " +
                "The block gas limit is " + numerical.block_gas_limit);
            return;
        }
        if (!checkIntrinsicGas()) {
            alertify.error("One or more of your transactions do not have a gas limit high enough. " +
                "The minimum gas required to send a transaction is 21000.")
        }

        if (pending_send_transactions.length === 0) {
            alertify.error("You must add at least one transaction to the block.");
        }

        var popup_content = document.getElementById("popup_content_confirm_transactions").innerHTML;

        //ensure correct
        $("#modal-transaction-confirm").find(".tran_send_modal").append(popup_content);
        $("#modal-transaction-confirm").modal("show");

        refresh_pending_transaction_table('final_tx_list_for_confirmation', false);


    });
    $('body').on('submit', '#send_block_post_confirmation', function (e) {
        e.preventDefault();
        if (!connectionMaintainer.isConnected()) {
            alertify.error("You must be connected to a node to do this.")
            return;
        }
        web3.hls.sendTransactions(pending_send_transactions)
            .then(function (args) {
                if (pending_send_transactions.length <= 1) {
                    alertify.success("Transaction sent successfully");
                } else {
                    alertify.success("Block sent successfully");
                }
                $("#modal-transaction-confirm").find(".tran_send_modal").html("");
                $("#modal-transaction-confirm").modal("hide");
                $("#modal-transaction-success").modal("show");
                clear_vars();
                refreshDashboard();
                $('#input_amount').val("").trigger("change");
                $('#input_to').val("").trigger("change");
                updateInputLabels();

            })
            .catch(function (error) {
                var error_message = getNodeMessageFromError(error);
                $("#modal-transaction-confirm").find(".tran_send_modal").html("");
                $("#modal-transaction-confirm").modal("hide");
                $("#modal-transaction-failed").modal("show");
                //alertify.error("Error when sending block: "+error_message);
                throw error;

            });

    });
    $('body').on('click', '.delete_transaction', function () {
        var index = $(this).data('index');
        pending_send_transactions.splice(index, 1);
        refresh_pending_transaction_table()
    });
    //contact list
    $('#add_contact_form').submit(function (e) {
        e.preventDefault();

        var contact_name = $("#add_contact_form_name").val();
        var contact_address = $("#add_contact_form_address").val();
        if (!(validateInputs(contact_name, 'contact_name') === true)) {
            alertify.error(validateInputs(contact_name, 'contact_name'));
            return;
        }
        if (!(validateInputs(contact_address, 'wallet_address') === true)) {
            alertify.error(validateInputs(contact_address, 'wallet_address'));
            return;
        }
        server.addContact(contact_name, contact_address)
            .then(function (response) {
                ////console.log(response);
                if (response !== false && "success" in response) {
                    $("#add_contact_form_name").val('');
                    $("#add_contact_form_address").val('');
                    refreshContactList();
                    alertify.success("New contact added successfully.");
                } else {
                    var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                    alertify.error(popup_content);
                }
            });

    });
    $('#modal-contact-remove-wallet-success , #modal-contact-remove-wallet-failed').on('hidden.bs.modal', function () {
        location.reload();
    });
    //add local wallet
    $('#generate_offline_wallet_form').submit(function (e) {
        e.preventDefault();
        var password = $("#generate_offline_wallet_password").val();
        if (!(validateInputs(password, 'password') === true)) {
            alertify.error(validateInputs(password, 'password'));
            return;
        }
        var new_wallet = web3.eth.accounts.create();
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);
        var filename = "HLS_wallet_" + new_wallet.address;
        // alertify.success(JSON.stringify(keystore));
        var blob = new Blob([JSON.stringify(keystore)], { type: "text/plain;charset=utf-8" });
        fileSaver.saveAs(blob, filename + ".txt");

        $('#generate_offline_wallet_password').val("");
        $('#generate_offline_wallet_password').trigger("change");
        addOfflineWallet(new_wallet);
        //refreshDashboard();
        alertify.success("The new wallet has been loaded and added to local wallets on the top menu.");
    });
    $('#generate_offline_wallet_form_local').submit(function (e) {
        e.preventDefault();
        var password = $("#generate_offline_wallet_password_local").val();
        if (!(validateInputs(password, 'password') === true)) {
            alertify.error(validateInputs(password, 'password'));
            return;
        }
        var new_wallet = web3.eth.accounts.create();
        //console.log(new_wallet);
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);
        var filename = "HLS_wallet_" + new_wallet.address;
        //console.log(new_wallet);
        //console.log(keystore);
        // alertify.success(JSON.stringify(keystore));
        var blob = new Blob([JSON.stringify(keystore)], { type: "text/plain;charset=utf-8" });
        fileSaver.saveAs(blob, filename + ".txt");


        addOfflineWalletLocal(new_wallet);
        $('#generate_offline_wallet_password_local').val("");
        $('#generate_offline_wallet_password_local').trigger("change");
        refreshDashboard();
        alertify.success("The new wallet has been loaded and added to local wallets on the top menu.");
    });
    $('#load_offline_wallet_private_key_form').submit(function (e) {
        e.preventDefault();
        var privateKey = $("#load_offline_wallet_from_private_key").val();

        if (privateKey === '' || privateKey === undefined) {
            alertify.error("You must enter a private key to be loaded");
            return;
        }
        if (!web3.utils.isHexStrict(privateKey)) {
            // Try adding the 0x and see if it passes then.
            privateKey = "0x" + privateKey;
            if (!web3.utils.isHexStrict(privateKey)) {
                // If it still fails, then it is malformed
                alertify.error('Private key appears to be incorrectly formatted.');
                return;
            }
        }

        if (!isPrivateKey(privateKey)) {
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        try {
            var new_wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
        } catch (err) {
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        if (new_wallet.address in available_offline_accounts) {
            alertify.error("You have already added a wallet with this address to your offline wallets.")
            return
        }

        $('#load_offline_wallet_from_private_key').val("").trigger("change");
        addOfflineWallet(new_wallet);
        refreshDashboard();
        alertify.success("The new wallet has been loaded and added to offline wallets on the top menu.");
        ////console.log("private key added")

    });
    $('#load_offline_wallet_private_key_form_local').submit(function (e) {
        e.preventDefault();
        var privateKey = $("#load_offline_wallet_from_private_key_local").val();

        if (privateKey === '' || privateKey === undefined) {
            alertify.error("You must enter a private key to be loaded");
            return;
        }
        if (!web3.utils.isHexStrict(privateKey)) {
            // Try adding the 0x and see if it passes then.
            privateKey = "0x" + privateKey;
            if (!web3.utils.isHexStrict(privateKey)) {
                // If it still fails, then it is malformed
                alertify.error('Private key appears to be incorrectly formatted.');
                return;
            }
        }

        if (!isPrivateKey(privateKey)) {
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        try {
            var new_wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
        } catch (err) {
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        if (new_wallet.address in available_offline_accounts) {
            alertify.error("You have already added a wallet with this address to your offline wallets.")
            return
        }

        $('#load_offline_wallet_private_key_form_local').val("").trigger("change");
        addOfflineWalletLocal(new_wallet);
        refreshDashboard();
        alertify.success("The new wallet has been loaded and added to offline wallets on the top menu.");
        ////console.log("private key added")

    });
    $('body').on('click', '#load_offline_wallet_from_keystore_fake_file_input', function (e) {
        $('#load_offline_wallet_from_keystore_file_input').click();
    });

    $('body').on('change', '#load_offline_wallet_from_keystore_file_input', function (e) {
        var filename = $(this).val().split(/(\\|\/)/g).pop().substr(0, 30);
        if (filename == "") {
            $('#load_offline_wallet_from_keystore_fake_file_input').removeClass('filled');
            $('#load_offline_wallet_from_keystore_fake_file_input').text("Select keystore file");
        } else {
            $('#load_offline_wallet_from_keystore_fake_file_input').addClass('filled');
            $('#load_offline_wallet_from_keystore_fake_file_input').text(filename + "...");
        }
    });
    $('body').on('click', '#load_offline_wallet_from_keystore_fake_file_input_local', function (e) {
        $('#load_offline_wallet_from_keystore_file_input_local').click();
    });

    $('body').on('change', '#load_offline_wallet_from_keystore_file_input_local', function (e) {
        var filename = $(this).val().split(/(\\|\/)/g).pop().substr(0, 30);
        if (filename == "") {
            $('#load_offline_wallet_from_keystore_fake_file_input_local').removeClass('filled');
            $('#load_offline_wallet_from_keystore_fake_file_input_local').text("Select keystore file");
        } else {
            $('#load_offline_wallet_from_keystore_fake_file_input_local').addClass('filled');
            $('#load_offline_wallet_from_keystore_fake_file_input_local').text(filename + "...");
        }
    });
    $('#load_offline_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        var password = $("#load_offline_wallet_from_keystore_password").val();
        var keystore_file = $("#load_offline_wallet_from_keystore_file_input").prop('files')[0]
        if (password === '' || keystore_file === '' || keystore_file === undefined) {
            alertify.error("You must choose a keystore file and enter a password");
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var json_account = reader.result;
            try {
                json_account = fixMEWWalletJSON(json_account);
                var new_wallet = web3.eth.accounts.decrypt(JSON.parse(json_account), password)
            } catch (err) {
                alertify.error('Incorrect keystore password');
                return;
            }

            if (new_wallet.address in available_offline_accounts) {
                alertify.error("You have already added a wallet with this address to your offline wallets.")
                return
            }

            $('#load_offline_wallet_from_keystore_file_input').val("").trigger("change");
            $('#load_offline_wallet_from_keystore_fake_file_input').text("Select keystore file");
            $('#load_offline_wallet_from_keystore_password').val("").trigger("change");
            addOfflineWallet(new_wallet);
            refreshDashboard();
            alertify.success("The new wallet has been loaded and added to offline wallets on the top menu.");
            ////console.log("private key added")
        }

        reader.readAsText(keystore_file);

    });
    $('#load_offline_wallet_keystore_form_local').submit(function (e) {
        e.preventDefault();
        var password = $("#load_offline_wallet_from_keystore_password_local").val();
        var keystore_file = $("#load_offline_wallet_from_keystore_file_input_local").prop('files')[0]
        if (password === '' || keystore_file === '' || keystore_file === undefined) {
            alertify.error("You must choose a keystore file and enter a password");
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var json_account = reader.result;
            try {
                json_account = fixMEWWalletJSON(json_account);
                var new_wallet = web3.eth.accounts.decrypt(JSON.parse(json_account), password)
            } catch (err) {
                alertify.error('Incorrect keystore password');
                return;
            }

            if (new_wallet.address in available_offline_accounts) {
                alertify.error("You have already added a wallet with this address to your offline wallets.")
                return
            }

            $('#load_offline_wallet_from_keystore_file_input_local').val("").trigger("change");
            $('#load_offline_wallet_from_keystore_fake_file_input_local').text("Select keystore file");
            $('#load_offline_wallet_from_keystore_password_local').val("").trigger("change");

            addOfflineWalletLocal(new_wallet);
            refreshDashboard();
            alertify.success("The new wallet has been loaded and added to offline wallets on the top menu.");
            ////console.log("private key added")
        }

        reader.readAsText(keystore_file);

    });
    //add online wallet
    $('#generate_online_wallet_form').submit(function (e) {
        e.preventDefault();
        // loaderPopup();
        var password = $("#generate_online_wallet_password").val();
        var username = $("#generate_online_wallet_username").val();
        var wallet_name = $("#generate_online_wallet_name").val();
        if (!(validateInputs(username, 'username') === true)) {
            alertify.error(validateInputs(username, 'username'));
            return;
        }
        if (!(validateInputs(wallet_name, 'wallet_name') === true)) {
            alertify.error(validateInputs(wallet_name, 'wallet_name'));
            return;
        }

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.signIn(username, password)
            .then(function (response) {
                if (response !== false && "success" in response) {
                    var new_wallet = web3.eth.accounts.create();
                    var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);
                    server.addOnlineWallet(keystore, wallet_name)
                        .then(function (response2) {
                            $('#generate_online_wallet_username').val("");
                            $('#generate_online_wallet_username').trigger("change");

                            $('#generate_online_wallet_name').val("");
                            $('#generate_online_wallet_name').trigger("change");

                            $('#generate_online_wallet_password').val("");
                            $('#generate_online_wallet_password').trigger("change");
                            addOnlineWallet(new_wallet, response2['id'], wallet_name);
                            refreshDashboard();
                            alertify.success("The new wallet has been added.");
                        });
                } else {
                    alertify.error("The username and password you entered didn't match. Please type the username and password you use to log in to your account.")
                }
            });

    });

    $('#load_online_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        ////console.log("loading wallet from keystore")
        // loaderPopup();
        var password = $("#load_online_wallet_password").val();
        var username = $("#load_online_wallet_username").val();
        var wallet_name = $("#load_online_wallet_name").val();
        if (!(validateInputs(username, 'username') === true)) {
            alertify.error(validateInputs(username, 'username'));
            return;
        }
        if (!(validateInputs(wallet_name, 'wallet_name') === true)) {
            alertify.error(validateInputs(wallet_name, 'wallet_name'));
            return;
        }

        var keystore_password = $("#load_online_wallet_from_keystore_password").val();
        var keystore_file = $("#load_online_wallet_from_keystore_file_input").prop('files')[0]

        if (keystore_password === '' || keystore_file === '' || keystore_file === undefined) {
            alertify.error("You must choose a keystore file and enter a password");
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var json_account = reader.result;
            try {
                json_account = fixMEWWalletJSON(json_account);
                var new_wallet = web3.eth.accounts.decrypt(JSON.parse(json_account), keystore_password)
            } catch (err) {
                alertify.error('Incorrect keystore password');
                return;
            }

            if (new_wallet.address in available_online_accounts) {
                alertify.error("You have already added a wallet with this address to your online wallets.")
                return
            }
            var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);

            server.addOnlineWallet(keystore, wallet_name)
                .then(function (response2) {

                    $('#load_online_wallet_username').val("").trigger("change");
                    $('#load_online_wallet_name').val("").trigger("change");
                    $('#load_online_wallet_password').val("").trigger("change");

                    $('#load_online_wallet_from_keystore_file_input').val("");
                    $('#load_online_wallet_from_keystore_fake_file_input').text("Select keystore file");
                    $('#load_online_wallet_from_keystore_password').val("");

                    addOnlineWallet(new_wallet, response2['id'], wallet_name);
                    refreshDashboard();
                    updateInputLabels();
                    alertify.success("The new wallet has been added.");
                });


        }

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.signIn(username, password)
            .then(function (response) {
                if (response !== false && "success" in response) {
                    reader.readAsText(keystore_file);
                } else {
                    popup("The username and password you entered didn't match. Please type the username and password you use to log in to your account.")
                }
            });


    });
    $('#load_online_wallet_private_key_form').submit(function (e) {
        e.preventDefault();
        ////console.log("loading wallet from private key")
        //loaderPopup();
        var password = $("#load_online_wallet_from_private_key_password").val();
        var username = $("#load_online_wallet_from_private_key_username").val();
        var wallet_name = $("#load_online_wallet_from_private_key_name").val();
        if (!(validateInputs(username, 'username') === true)) {
            alertify.error(validateInputs(username, 'username'));
            return;
        }
        if (!(validateInputs(wallet_name, 'wallet_name') === true)) {
            alertify.error(validateInputs(wallet_name, 'wallet_name'));
            return;
        }

        var privateKey = $("#load_online_wallet_from_private_key").val();

        if (privateKey === '' || privateKey === undefined) {
            alertify.error("You must enter a private key to be loaded");
            return;
        }
        if (!web3.utils.isHexStrict(privateKey)) {
            // Try adding the 0x and see if it passes then.
            privateKey = "0x" + privateKey;
            if (!web3.utils.isHexStrict(privateKey)) {
                // If it still fails, then it is malformed
                alertify.error('Private key appears to be incorrectly formatted.');
                return;
            }
        }

        if (!isPrivateKey(privateKey)) {
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        try {
            var new_wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
        } catch (err) {
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        if (new_wallet.address in available_online_accounts) {
            alertify.error("You have already added a wallet with this address to your online wallets.")
            return
        }
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.signIn(username, password)
            .then(function (response) {
                if (response !== false && "success" in response) {
                    server.addOnlineWallet(keystore, wallet_name)
                        .then(function (response2) {


                            $('#load_online_wallet_from_private_key_username').val("").trigger("change");
                            $('#load_online_wallet_from_private_key_name').val("").trigger("change");
                            $('#load_online_wallet_from_private_key_password').val("").trigger("change");
                            $('#load_online_wallet_from_private_key').val("").trigger("change");


                            addOnlineWallet(new_wallet, response2['id'], wallet_name);
                            refreshDashboard();
                            updateInputLabels();
                            alertify.success("The new wallet has been added.");
                        });
                } else {
                    alertify.error("The username and password for your account that you entered didn't match. Please type the username and password you use to log in to your account.")
                }
            });




    });

    $('body').on('click', '.generate_new_two_factor', function (e) {
        var val = $(this).data('val');
        server.getNew2FASecret()
            .then(function (response) {
                if (response !== false && "success" in response) {
                    //success
                    // var popup_content = document.getElementById("popup_content_new_two_factor_authentication").innerHTML;

                    // //ensure correct
                    // popup(popup_content, 400);

                    $('#two_factor_authentication_confirm_qr_code').attr('src', response['img_url']);
                    $('#two_factor_authentication_confirm_secret').html(response['secret']);

                    $('#modal-enable-2fa').modal("show");

                } else {
                    //fail
                    var popup_content = "Oops, something went wrong:" + response['error_description'];
                    alertify.error(popup_content);
                }
            })
    });
    $('body').on('submit', '#confirm_new_two_factor_authentication_secret', function (e) {
        e.preventDefault();
        var secret = $('#two_factor_authentication_confirm_secret').html();
        var code = $('#new_two_factor_authentication_code').val();
        server.save2FASecret(secret, code)
            .then(function (response) {
                if (response !== false && "success" in response) {
                    $('#modal-enable-2fa').modal("hide");
                    $("#modal-enable-2fa-success").modal("show");
                    sessionStorage.setItem("facode", true);
                    set_two_factor_authentication_status(true);
                } else {
                    $('#modal-enable-2fa').modal("hide");
                    $("#modal-enable-2fa-failed").modal("show");
                }
            })

    });
    $('#two_factor_disable').click(function () {
        server.delete2FASecret()
            .then(function (response) {
                if (response !== false && "success" in response) {
                    $("#modal-disable-2fa").modal("show");
                    sessionStorage.setItem("facode", false);
                    set_two_factor_authentication_status(false);
                } else {
                    var popup_content = "Oops, something went wrong:" + response['error_description'];
                    alertify.error(popup_content);
                }
            });
    });

    $('body').on('click', '.edit_online_wallet', function (e) {
        var current = $(this).prev("label#switch_wallet_link").data("keystores");
        var wallet_id = $(this).prev("label#switch_wallet_link").data("wallet_id");
        var password = sessionStorage.getItem("password");
        console.log(current);
        var current_wallet = web3.eth.accounts.decrypt(JSON.parse(current.keystore), password, null, current.name);
        current_wallet['wallet_id'] = wallet_id;
        current_wallet['keystore'] = current.keystore;
        sessionStorage.setItem("current_wallet", JSON.stringify(current_wallet));
        window.location.href = 'existing_online_wallet.html';
    });
    $('body').on('click', '.edit_online_wallet_local', function (e) {
        var current = $(this).next("label#switch_wallet_link_local").data("keystore");

        sessionStorage.setItem("current_wallet_local", JSON.stringify(current));
        window.location.href = 'existing_online_wallet_local.html';
    });
    $('body').on('click', '.edit_online_wallet_local_live', function (e) {
        var current = $(this).next("label#switch_wallet_link_local").data("keystore");

        sessionStorage.setItem("current_wallet", JSON.stringify(current));
        window.location.href = 'existing_offline_wallet.html';
    });
    $('body').on('click', '.delete_online_wallet_link', function (e) {
        var wallet_address = $(this).data('address');
        var wallet_id = $(this).data('wallet_id');
        var wallet_name = $("#hls-name").text();
        $(".wallet-name").text(wallet_name);
        $(".wallet-address").text(wallet_address);

        $('#delete_online_wallet_confirmation_popup_submit').attr('data-address', wallet_address);
        $('#delete_online_wallet_confirmation_popup_submit').attr('data-wallet_id', wallet_id);

    });
    $('body').on('click', '.delete_online_wallet_link', function (e) {
        var wallet_address = $(this).data('address');
        deleteOfflineWallet(wallet_address);
    });
    $('body').on('click', '#delete_online_wallet_confirmation_popup_submit', function (e) {
        var wallet_address = $(this).data('address');
        var wallet_id = $(this).data('wallet_id');
        var wallet_name = $("#hls-name").text();
        server.deleteOnlineWallet(wallet_id, wallet_name)
            .then(function (response) {
                if (response !== false && "success" in response) {
                    $("#modal-delete-wallet").modal("hide");
                    $("#modal-delete-wallet-success").modal("show");
                    //popup("Wallet deleted successfully.");
                    deleteOnlineWallet(wallet_address);
                    var current_wallet = JSON.parse(sessionStorage.getItem("current_wallet"));
                    if (current_wallet != null) {
                        if (current_wallet.wallet_id == wallet_id) {
                            sessionStorage.setItem("current_wallet", null);
                        }
                    }
                    var enabled_wallet = JSON.parse(sessionStorage.getItem("enabled_wallet"));
                    if (enabled_wallet != null) {
                        if (enabled_wallet.wallet_id == wallet_id) {
                            sessionStorage.setItem("enabled_wallet", null);
                        }
                    }
                    $("live_wallet").find('li').each(function () {
                        if ($(this).attr("id") == wallet_id) {
                            $(this).remove();
                        }
                    });
                    var walletmenu = JSON.parse(sessionStorage.getItem("walletmenu"));
                    //console.log(walletmenu);
                    $.each(walletmenu, function (i, item) {
                        if (i == wallet_id) {
                            delete walletmenu[wallet_id];
                        }
                    });
                    sessionStorage.setItem("walletmenu", JSON.stringify(walletmenu));
                    window.location.href = './dashboard.html';
                    // switchToTab('main_page-dashboard');
                } else {
                    alertify.error("An error occured.");
                }
            })

    });
    $('#edit_online_wallet_rename_form').submit(function (e) {
        e.preventDefault();
        var new_wallet_name = $("#edit_online_wallet_rename_name_input").val();
        var wallet_address = $('#currently_editing_online_wallet_address').val();
        var wallet_id = $("#edit_online_wallet_rename_id_input").val();
        var previous_wallet_name = $("#edit_online_wallet_rename_oldname_input").val();
        var keystore = $('#edit_online_wallet_rename_keystore_input').val();
        var password = sessionStorage.getItem("password");
        var existing_account = web3.eth.accounts.decrypt(JSON.parse(JSON.stringify(keystore)), password, null, previous_wallet_name);

        //console.log(existing_account);
        if (!(validateInputs(new_wallet_name, 'wallet_name') === true)) {
            alertify.error(validateInputs(new_wallet_name, 'wallet_name'));
            return;
        }
        server.renameOnlineWallet(wallet_id, previous_wallet_name, new_wallet_name)
            .then(function (response) {
                if (response !== false && "success" in response) {
                    if (sending_account.address === wallet_address) {
                        deleteOnlineWallet(wallet_address);
                    } else {
                        deleteOnlineWallet(wallet_address);
                    }
                    prepareEditOnlineWalletPage(wallet_address, new_wallet_name, wallet_id, keystore);
                    var current_wallet = JSON.parse(sessionStorage.getItem("current_wallet"));
                    if (current_wallet != null) {
                        if (current_wallet.wallet_id == wallet_id) {
                            current_wallet['walletname'] = new_wallet_name;
                            sessionStorage.setItem("current_wallet", JSON.stringify(current_wallet));
                        }
                    }
                    var enabled_wallet = JSON.parse(sessionStorage.getItem("enabled_wallet"));
                    if (enabled_wallet != null) {
                        if (enabled_wallet.wallet_id == wallet_id) {
                            enabled_wallet['walletname'] = new_wallet_name;
                            sessionStorage.setItem("enabled_wallet", JSON.stringify(enabled_wallet));
                        }
                    }
                    var walletmenu = JSON.parse(sessionStorage.getItem("walletmenu"));
                    //console.log(walletmenu);
                    var wallet_change = '';
                    $.each(walletmenu, function (i, item) {
                        if (i == wallet_id) {
                            wallet_change = item;
                            var r = $('<p></p>').append(wallet_change);
                            $(r[0]).find("li").find("a").text(new_wallet_name);
                            var r1 = $(r[0]).html();
                            walletmenu[i] = r1;

                        }
                    });
                    sessionStorage.setItem("walletmenu", JSON.stringify(walletmenu));


                    alertify.success("Wallet renamed successfully.");
                    location.reload();
                } else {
                    alertify.error("An error has occured.");
                }
            });

    });
    $('#save_online_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        var password = $("#save_online_wallet_keystore_form_password").val();
        if (!(validateInputs(password, 'password') === true)) {
            alertify.error(validateInputs(password, 'password'));
            return;
        }
        var wallet_address = $('#currently_editing_online_wallet_address').val();
        var keystore = $('#save_online_wallet_rename_keystore_input').val();
        var previous_wallet_name = $("#edit_online_wallet_rename_name_input").val();
        var password = sessionStorage.getItem("password");
        var existing_account = web3.eth.accounts.decrypt(JSON.parse(JSON.stringify(keystore)), password, null, previous_wallet_name);


        var keystore = web3.eth.accounts.encrypt(existing_account.privateKey, password);
        var filename = "HLS_wallet_" + existing_account.address;
        var blob = new Blob([JSON.stringify(keystore)], { type: "text/plain;charset=utf-8" });
        fileSaver.saveAs(blob, filename + ".txt");

        $('#save_online_wallet_keystore_form_password').val("");
        $('#save_online_wallet_keystore_form_password').trigger("change");

    });
    $("input:checkbox").on('click', function () {
        var $box = $(this);
        if ($box.is(":checked")) {
            var group = "input:checkbox[name='" + $box.attr("name") + "']";
            $(group).prop("checked", false);
            $box.prop("checked", true);
        } else {
            $box.prop("checked", false);
        }
    });
});
$('#save_online_wallet_keystore_form_local').submit(function (e) {
    e.preventDefault();
    var password = $("#save_offline_wallet_keystore_form_password_local").val();
    if (!(validateInputs(password, 'password') === true)) {
        alertify.error(validateInputs(password, 'password'));
        return;
    }
    var current_wallet = JSON.parse(sessionStorage.getItem("enabled_wallet_local"));
    var keystore = web3.eth.accounts.encrypt(current_wallet.privateKey, password);
    var filename = "HLS_wallet_" + current_wallet.address;
    var blob = new Blob([JSON.stringify(keystore)], { type: "text/plain;charset=utf-8" });
    fileSaver.saveAs(blob, filename + ".txt");
    $('#save_offline_wallet_keystore_form_password_local').val("");
    $('#save_offline_wallet_keystore_form_password_local').trigger("change");

});
function main() {
    $('.preloader').show();
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");
    var facode = sessionStorage.getItem("facode");
    var pathname = window.location.pathname.split("/");
    if(pathname[pathname.length - 1] == "index.html"){
        window.location.href = './login.html';
    }
    if (username == null && password == null && (pathname[pathname.length - 1] != "local_wallet_local.html" && pathname[pathname.length - 1] != "dashboard_local.html" && pathname[pathname.length - 1] != "existing_online_wallet_local.html" && pathname[pathname.length - 1] != "paper_wallet_local.html")) {
        window.location.href = './login.html';
    } else {
        var print_local_wallet = sessionStorage.getItem("local_wallet");
        $('.local_wallet').find(".local_remove").remove();
        $.each(JSON.parse(print_local_wallet), function (i, item) {
            $('.local_wallet').prepend(item);
        });
        if (pathname[pathname.length - 1] == "existing_online_wallet_local.html") {
            var current_wallet = JSON.parse(sessionStorage.getItem("current_wallet_local"));
            if (current_wallet != null) {
                var wallet_name_short = current_wallet.address.substr(0, 15) + "...";
                set_account_status_local(current_wallet.address, wallet_name_short);
                prepareEditOnlineWalletPage_local(current_wallet.address, '', '', current_wallet, current_wallet);

                sending_account = current_wallet;
                var address_wallet = current_wallet.address;
                $(document).find(".switch").each(function () {
                    var add = $(this).attr("data-address");
                    if (add == address_wallet) {
                        $(this).find("input[type='checkbox']").prop('checked', true);
                    }
                })
            }
        } else {
            var current_wallet = JSON.parse(sessionStorage.getItem("enabled_wallet_local"));
            if (current_wallet != null) {
                var wallet_name_short = current_wallet.address.substr(0, 15) + "...";
                set_account_status_local(current_wallet.address, wallet_name_short);
                prepareEditOnlineWalletPage_local(current_wallet.address, '', '', current_wallet, current_wallet);
                $('.paper_private').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + current_wallet.privateKey);
                $('#en_privateKey').text(current_wallet.privateKey);

                sending_account = current_wallet;
                var address_wallet = current_wallet.address;
                $(document).find(".switch").each(function () {
                    var add = $(this).attr("data-address");
                    if (add == address_wallet) {
                        $(this).find("input[type='checkbox']").prop('checked', true);
                    }
                })
            }
        }
        var current_wallet = JSON.parse(sessionStorage.getItem("enabled_wallet_local"));
        if (current_wallet != null) {
            var wallet_name_short = current_wallet.address.substr(0, 15) + "...";
            set_account_status_local(current_wallet.address, wallet_name_short);
            prepareEditOnlineWalletPage(current_wallet.address, '', '', current_wallet, current_wallet);
            $('.paper_private').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + current_wallet.privateKey);
            $('#en_privateKey').text(current_wallet.privateKey);
            var address_wallet = current_wallet.address;
            $(document).find(".switch").each(function () {
                var add = $(this).attr("data-address");
                if (add == address_wallet) {
                    $(this).find("input[type='checkbox']").prop('checked', true);
                }
            })

            sending_account = current_wallet;
        }
        afterLoginInit();

        setTimeout(function () {
            refresh_transactions(0);
        }, 1000)
        $(".preloader").hide();
    }
    if (pathname[pathname.length - 1] != "local_wallet_local.html" && pathname[pathname.length - 1] != "dashboard_local.html" && pathname[pathname.length - 1] != "existing_online_wallet_local.html" && pathname[pathname.length - 1] != "paper_wallet_local.html") {
        set_two_factor_authentication_status(facode);
        var walletmenu = sessionStorage.getItem("walletmenu");
        $.each(JSON.parse(walletmenu), function (i, item) {
            $('.live_wallet').prepend(item);
        });
        $("#lusername").text(username);
        $(".lusername").val(username);
        var keystores = sessionStorage.getItem("online_keystores");

        populateOnlineKeystores($.parseJSON(keystores), password);

        sessionStorage.setItem("online_keystores", keystores);
        if (pathname[pathname.length - 1] == "existing_online_wallet.html") {
            var current_wallet = JSON.parse(sessionStorage.getItem("current_wallet"));
            if (current_wallet != null) {
                set_account_status(current_wallet.address, current_wallet.walletname);
                prepareEditOnlineWalletPage(current_wallet.address, current_wallet.walletname, current_wallet.wallet_id, current_wallet.keystore, current_wallet);

                sending_account = current_wallet;
                var address_wallet = current_wallet.address;
                $(document).find(".switch").each(function () {
                    var add = $(this).attr("data-address");
                    if (add == address_wallet) {
                        $(this).find("input[type='checkbox']").prop('checked', true);
                    }
                })
            }
            //refreshDashboard();
        } else if(pathname[pathname.length - 1] == "existing_offline_wallet.html"){
            var current_wallet = JSON.parse(sessionStorage.getItem("enabled_wallet_local"));
            if (current_wallet != null) {
                var wallet_name_short = current_wallet.address.substr(0, 15) + "...";
                set_account_status_local_offline(current_wallet.address, wallet_name_short);
                prepareEditOfflineWalletPage(current_wallet.address, '', '', current_wallet, current_wallet);

                sending_account = current_wallet;
                var address_wallet = current_wallet.address;
                $(document).find(".switch").each(function () {
                    var add = $(this).attr("data-address");
                    if (add == address_wallet) {
                        $(this).find("input[type='checkbox']").prop('checked', true);
                    }
                })
            }
            
        } else {
            var current_wallet = JSON.parse(sessionStorage.getItem("enabled_wallet"));
            console.log(current_wallet);
            if (current_wallet != null) {
                set_account_status(current_wallet.address, current_wallet.walletname);
                prepareEditOnlineWalletPage(current_wallet.address, current_wallet.walletname, current_wallet.wallet_id, current_wallet.keystore, current_wallet);
                $('.paper_private').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + current_wallet.privateKey);
                $('#en_privateKey').text(current_wallet.privateKey);

                sending_account = current_wallet;
                //refreshDashboard();
                var address_wallet = current_wallet.address;
                $(document).find(".switch").each(function () {
                    var add = $(this).attr("data-address");
                    if (add == address_wallet) {
                        $(this).prev("input[type='radio']").prop('checked', true);
                    }
                })
            }
        }
        afterLoginInit();
        refreshDashboard();
        // setTimeout(function () {
        //     refresh_transactions(0);
        // }, 1000)
    }
    
}
function prepareEditOfflineWalletPage(wallet_address, wallet_name, wallet_id, keystore,keystores=''){
    //Add the correct data to the editing page
    $('#currently_editing_offline_wallet_address').val(wallet_address);
    $('#currently_editing_offline_wallet_address_status').html(wallet_address);
    $('#edit_offline_wallet_enable_wallet_submit').data('address', wallet_address);
    $('#edit_offline_wallet_delete_wallet_submit').data('address', wallet_address);
}

function deleteOnlineWallet(wallet_address) {
    if (sending_account !== undefined && sending_account !== null && sending_account.address === wallet_address) {
        sending_account = null;
        refreshDashboard();
    }
}
function prepareEditOnlineWalletPage(wallet_address, wallet_name, wallet_id, keystore, keystores = '') {
    //alert();
    //Add the correct data to the editing page
    $('#currently_editing_online_wallet_address').val(wallet_address);
    $('#edit_online_wallet_enable_wallet_submit').attr('data-address', wallet_address);
    $('#edit_online_wallet_enable_wallet_submit').attr('data-wallet_id', wallet_id);
    $('#edit_online_wallet_enable_wallet_submit').attr('data-keystore', keystore);
    $('#edit_online_wallet_enable_wallet_submit').attr('data-keystores', JSON.stringify(keystores));
    $('#edit_online_wallet_delete_wallet_submit').attr('data-address', wallet_address);
    $('#edit_online_wallet_delete_wallet_submit').attr('data-wallet_id', wallet_id);
    $('#edit_online_wallet_delete_wallet_submit').attr('data-keystore', keystore);
    $('#edit_online_wallet_rename_id_input').val(wallet_id).trigger("change");
    $('#edit_online_wallet_rename_oldname_input').val(wallet_name).trigger("change");
    $('#edit_online_wallet_rename_name_input').val(wallet_name).trigger("change");
    $('#edit_online_wallet_rename_keystore_input').val(keystore).trigger("change");
    $('#save_online_wallet_rename_keystore_input').val(keystore).trigger("change");
    $('#currently_editing_online_wallet_address_status').html(wallet_name + " <br>" + wallet_address)
}
function prepareEditOnlineWalletPage_local(wallet_address, wallet_name, wallet_id, keystore, keystores = '') {
    //alert();
    //Add the correct data to the editing page
    $('#currently_editing_online_wallet_address').val(wallet_address);
    $('#edit_online_wallet_enable_wallet_submit').attr('data-address', wallet_address);
    $('#edit_online_wallet_enable_wallet_submit').attr('data-wallet_id', wallet_id);
    $('#edit_online_wallet_enable_wallet_submit_local').attr('data-keystore', JSON.stringify(keystore));
    $('#edit_online_wallet_enable_wallet_submit').attr('data-keystores', JSON.stringify(keystores));
    $('#edit_online_wallet_delete_wallet_submit').attr('data-address', wallet_address);
    $('#edit_online_wallet_delete_wallet_submit').attr('data-wallet_id', wallet_id);
    $('#edit_online_wallet_delete_wallet_submit').attr('data-keystore', keystore);
    $('#edit_online_wallet_rename_id_input').val(wallet_id).trigger("change");
    $('#edit_online_wallet_rename_oldname_input').val(wallet_name).trigger("change");
    $('#edit_online_wallet_rename_name_input').val(wallet_name).trigger("change");
    $('#edit_online_wallet_rename_keystore_input').val(keystore).trigger("change");
    $('#save_online_wallet_rename_keystore_input_local').val(JSON.stringify(keystore)).trigger("change");
    $('#currently_editing_online_wallet_address_status').html(wallet_name + " <br>" + wallet_address)
}
function set_two_factor_authentication_status(tfa_enabled) {
    console.log(tfa_enabled);
    if (tfa_enabled == "true") {

        $('#two_factor_authentication_status').text('');
        $('#two_factor_authentication_status').removeClass("Disabled").addClass("Enabled");
        $('#two_factor_authentication_status').append('<i class="uil uil-shield"></i> Enabled');
    } else {

        $('#two_factor_authentication_status').text('');
        $('#two_factor_authentication_status').removeClass("Enabled").addClass("Disabled");
        $('#two_factor_authentication_status').append('<i class="uil uil-shield-slash"></i> Disabled');
    }
}
function fixMEWWalletJSON(jsonData) {
    var parsedAccount = JSON.parse(jsonData)
    if ("Crypto" in parsedAccount) {
        Object.defineProperty(parsedAccount, "crypto", Object.getOwnPropertyDescriptor(parsedAccount, "Crypto"));
        delete parsedAccount['Crypto'];
    }
    var json_account = JSON.stringify(parsedAccount)
    return json_account
}
function addOfflineWallet(new_wallet, do_not_make_active_account) {
    web3.hls.accounts.wallet.add(new_wallet);

    // available_offline_accounts[new_wallet.address] = new_wallet;
    // if (!(do_not_make_active_account === true)) {
    //     sending_account = new_wallet;
    //     refreshDashboard();
    // }

    // var wallet_name_short = new_wallet.address.substr(0, 15) + "...";

    // var wallet_menu_item = "<li class='local_remove'><a href='existing_online_wallet.html'>" + wallet_name_short + "</a><img class='switch_wallet_link' style='height: 20px;margin: 7px 0px 0px;' data-address='" + new_wallet.address + "' src='dist/assets/icon/use_button.png'></li>";
    // $('.local_wallet').prepend(wallet_menu_item);
    available_offline_accounts[new_wallet.address] = new_wallet;
    if (!(do_not_make_active_account === true)) {
        sending_account = new_wallet;
        refreshDashboard();
    }

    var wallet_name_short = new_wallet.address.substr(0, 10) + "...";
    var wallet_menu_item = "<li class='' id='" + new_wallet.address + "'><div class='custom-control-sidebar custom-radio-sidebar' style='display:flex;'><input type='radio' id='wallet_radio_" + new_wallet.address + "' name='customRadio-sidebar' class='custom-control-input-sidebar'><label class='custom-control-label-sidebar switch' id='switch_wallet_link_local' for='wallet_radio_" + new_wallet.address + "'  data-keystore= '" + JSON.stringify(new_wallet) + "' data-address='" + new_wallet.address + "'></label><a class='edit_online_wallet_local_live'>" + wallet_name_short + "</a></div></li>";
    //var wallet_menu_item = "<li class='local_remove'><a class='edit_online_wallet_local_live'>" + wallet_name_short + "</a><label class='switch' id='switch_wallet_link_local' data-keystore= '" + JSON.stringify(new_wallet) + "' data-address='" + new_wallet.address + "'><input type='checkbox' name='local_wallet_btn[1][]'><span class='slider1 round1'></span></label></li>";
    var local_wallet = sessionStorage.getItem("local_wallet");
    var obj = new Array();
    if (local_wallet != undefined && local_wallet != "null") {
        obj = JSON.parse(local_wallet);
    }
    obj.push(wallet_menu_item);
    //console.log(obj);
    sessionStorage.setItem("local_wallet", JSON.stringify(obj));
    //$('.local_wallet').prepend(wallet_menu_item);
    var print_local_wallet = sessionStorage.getItem("local_wallet");
    $('.local_wallet').find(".local_remove").remove();
    $.each(JSON.parse(print_local_wallet), function (i, item) {
        $('.local_wallet').prepend(item);
    });

}
function addOfflineWalletLocal(new_wallet, do_not_make_active_account) {
    web3.hls.accounts.wallet.add(new_wallet);

    available_offline_accounts[new_wallet.address] = new_wallet;
    if (!(do_not_make_active_account === true)) {
        sending_account = new_wallet;
        refreshDashboard();
    }

    var wallet_name_short = new_wallet.address.substr(0, 10) + "...";
    var wallet_menu_item = "<li class='' id='" + new_wallet.address + "'><div class='custom-control-sidebar custom-radio-sidebar' style='display:flex;'><input type='radio' id='wallet_radio_" + new_wallet.address + "' name='customRadio-sidebar' class='custom-control-input-sidebar'><label class='custom-control-label-sidebar switch' id='switch_wallet_link_local' for='wallet_radio_" + new_wallet.address + "' data-keystore= '" + JSON.stringify(new_wallet) + "' data-address='" + new_wallet.address + "'></label><a class='edit_online_wallet_local'>" + wallet_name_short + "</a></div></li>";
   // var wallet_menu_item = "<li class='local_remove'><a class='edit_online_wallet_local'>" + wallet_name_short + "</a><label class='switch' id='switch_wallet_link_local' data-keystore= '" + JSON.stringify(new_wallet) + "' data-address='" + new_wallet.address + "'><input type='checkbox' name='local_wallet_btn[1][]'><span class='slider1 round1'></span></label></li>";
    var local_wallet = sessionStorage.getItem("local_wallet");
    var obj = new Array();
    if (local_wallet != undefined && local_wallet != "null") {
        obj = JSON.parse(local_wallet);
    }
    obj.push(wallet_menu_item);
    //console.log(obj);
    sessionStorage.setItem("local_wallet", JSON.stringify(obj));
    //$('.local_wallet').prepend(wallet_menu_item);
    var print_local_wallet = sessionStorage.getItem("local_wallet");
    $('.local_wallet').find(".local_remove").remove();
    $.each(JSON.parse(print_local_wallet), function (i, item) {
        $('.local_wallet').prepend(item);
    });

}
function addOnlineWallet(new_wallet, wallet_id, wallet_name, do_not_make_active_account, keystores) {
    var enabled_wallet = sessionStorage.getItem("enabled_wallet");
        console.log(enabled_wallet);
    if(enabled_wallet != ""){
        new_wallet = JSON.parse(enabled_wallet);
    }
        web3.hls.accounts.wallet.add(new_wallet);
        // available_online_accounts[new_wallet.address] = new_wallet;
        // online_wallet_to_id_lookup[new_wallet.address] = wallet_id;
        // online_wallet_to_name_lookup[new_wallet.address] = wallet_name;
        if (!(do_not_make_active_account === true)) {
            sending_account = new_wallet;
            
            sessionStorage.setItem("enabled_wallet", JSON.stringify(new_wallet));
        }
       
        var address_wallet = new_wallet.address;
        
        $(document).find(".switch").each(function () {
            var add = $(this).attr("data-address");
            if (add == address_wallet) {
                $(this).prev("input[type='radio']").prop('checked', true);
            }
        })
        refreshDashboard();
   

    var wallet_name_short = wallet_name.substr(0, 15);
    if (wallet_name.length > 25) {
        wallet_name_short = wallet_name_short + "...";
    }
    keystores['name'] = keystores["name"].replace(/['"]+/g, '*');
    new_wallet = JSON.parse(JSON.stringify(new_wallet));
    //console.log(new_wallet);
    new_wallet['walletname'] = new_wallet["walletname"].replace(/['"]+/g, '*');
    var wallet_menu_item = "<li class='' id='" + wallet_id + "'><div class='custom-control-sidebar custom-radio-sidebar' style='display:flex;'><input type='radio' id='wallet_radio_" + wallet_id + "' name='customRadio-sidebar' class='custom-control-input-sidebar'><label class='custom-control-label-sidebar switch' id='switch_wallet_link' for='wallet_radio_" + wallet_id + "'  data-name='" + wallet_name.replace(/['"]+/g, '') + "' data-keystore='" + keystores["keystore"] + "' data-wallet_id='" + wallet_id + "'  data-keystores='" + JSON.stringify(keystores) + "' data-address='" + new_wallet.address + "'></label><a class='edit_online_wallet'>" + wallet_name_short + "</a></div></li>";
   // var wallet_menu_item = "<li class='local_remove'><a  class='edit_online_wallet'>" + wallet_name_short + "</a><label class='switch' id='switch_wallet_link'  data-name='" + wallet_name.replace(/['"]+/g, '') + "' data-keystore='" + keystores["keystore"] + "' data-wallet_id='" + wallet_id + "'  data-keystores='" + JSON.stringify(keystores) + "' data-address='" + new_wallet.address + "'><input type='checkbox' name='local_wallet_btn[1][]'><span class='slider1 round1'></span></label></li>";
    //console.log(wallet_menu_item);
    $('.live_wallet').prepend(wallet_menu_item);
    //Now add it to the menu
    // var wallet_menu_item = " <li role=\"presentation\" class=\"nav__item\">\n" +
    //     "                            <a href='#main_page-online_wallet' id='main_page-online_wallet-menu_item' class='nav__link edit_online_wallet' data-address='"+new_wallet.address+"'>\n" +
    //     "                                <div class='wallet_menu_item'>\n" +
    //     "                                     <div class='wallet_menu_item_name'>"+wallet_name_short+"</div><img class='switch_wallet_link' data-address='"+new_wallet.address+"' src='images/use_button.png'>\n" +
    //     "                                </div>\n" +
    //     "                            </a>\n" +
    //     "                        </li>"
    // $('#online_wallets_menu_list').prepend(wallet_menu_item);
}
function updateInputLabels() {
    $('input, textarea').each(function () {
        // Don't remove the active class if we click on the label
        if ($(this).is(":focus")) {
            return;
        }
        if (!$(this).val() || $(this).val() === "") {
            $(this).siblings('.input__label').removeClass('input__label--active');
        } else {

            $(this).siblings('.input__label').addClass('input__label--active');
        }
    })
}
function checkPendingTransactionsGasPrice() {
    pending_send_transactions.forEach(function (tx) {
        if (tx.gasPrice < current_min_gas_price) {
            return false;
        }
    });
    return true;
}
function checkBlockGasLimit() {
    var gas_used = 0;
    pending_send_transactions.forEach(function (tx) {
        gas_used += parseFloat(tx.gas);
    });

    return gas_used < numerical.block_gas_limit;
}
function checkIntrinsicGas() {
    pending_send_transactions.forEach(function (tx) {
        if (tx.gas < 21000) {
            return false;
        }
    });

    return true;
}
$("#dash-dateranges").click(function () {
    $(".preloader").show();
    refresh_transactions(0);
    $(".preloader").hide();
});
$(".tran_send").click(function () {
    refresh_transactions(0, "send");
});
$(".tran_receive").click(function () {
    refresh_transactions(0, "receive");
});
$(".tran_all").click(function () {
    refresh_transactions(0, "");
});



async function refresh_transactions(start_index, tran_type = 'all') {
    $('.preloader').show();
    if (sending_account == null) {
        return
    }
    if (start_index === undefined) {
        start_index = 0
    }
    var selectdate1 = $("#dash-daterange").val();
    if (selectdate1 != undefined) {
        var selectdate = selectdate1.split(" to ");
        if(selectdate.length > 1){

        
            var firstDate = new Date(selectdate[0]);
            var secondeDate = new Date(selectdate[1]);
            var dd1 = firstDate.getDate();
            var dd2 = secondeDate.getDate();
            var mm1 = firstDate.getMonth() + 1;
            var mm2 = secondeDate.getMonth() + 1;
            var y1 = firstDate.getFullYear();
            var y2 = secondeDate.getFullYear();
            console.log(mm1);
            console.log(mm2);
            if(mm1 == mm2){
                mm1 = mm1-1;
            }
            var start_timestamp = new Date(y1, mm1, dd1).getTime() / 1000;
            var end_timestamp = new Date(y2, mm2, dd2).getTime() / 1000;
            //console.log(start_timestamp);
            //console.log(end_timestamp);
        }
    } else {
        var pastDate = new Date();
        var dd1 = pastDate.getDate() - 365;
        var dd2 = pastDate.getDate();
        var mm = pastDate.getMonth() + 1;
        var y = pastDate.getFullYear();
        var start_timestamp = new Date(y, mm, dd1).getTime() / 1000;
        var end_timestamp = new Date(y, mm, dd2).getTime() / 1000;
    }
    var txs = "";
    if(start_timestamp && end_timestamp){
       // start_timestamp = new Date(2014, 01, 01).getTime() /1000;
       // start_timestamp =new Date().getDate().add;
       //console.log(start_timestamp);
       // var d = new Date();
       // end_timestamp = new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime() / 1000;
       // console.log(end_timestamp);
        txs = await accountHelpers.get_all_transactions_from_account(sending_account, start_timestamp, end_timestamp, start_index);
        console.log(txs);
    }
    $(".transaction_view").find("div").remove();
    if(txs.length == undefined){
        alertify.error("There is no transaction available.");
    }
    var dis='';
    $.each(txs, function (i, item) {
        if(tran_type == "send"){
            if(item.description != "Send transaction"){
                return;
            }
        }else if(tran_type == "receive"){
            if(item.description != "Receive transaction"){
                return;
            }
        }
        var d = new Date(0); 
        d.setUTCSeconds(item.timestamp);
        var options = { day: 'numeric', year: 'numeric', month: 'short' };
        var tableRef = '<div class="d-flex transaction_div collapsed" data-toggle="collapse"';
        tableRef += ' data-target="#alltrancollapseone' + item.timestamp + '" aria-expanded="true"';
        tableRef += 'aria-controls="alltrancollapseone' + item.timestamp + '" id="all_tran_1">';
        tableRef += '<div class="mr-3 table_data_1">';
        if (item.description === "Send transaction") {
            tableRef += ' <img src="dist/assets/icon/send.png" class="avatar_select rounded align-self-center" alt="Helios">';
        } else {
            tableRef += ' <img src="dist/assets/icon/receive.png" class="avatar_select rounded align-self-center" alt="Helios">';
        }
        tableRef += '</div>';
        tableRef += '<div class="mr-3 table_data_2">';
        var title = (item.description === "Send transaction") ? 'Sent' : 'Receive';
        tableRef += '<p>' + title + '</p>';
        tableRef += '<p>' + d.toLocaleString('en-US', options) + '</p>';
        tableRef += '</div>';

        tableRef += '<div class="mr-3 table_data_3">';
        tableRef += '<img src="dist/assets/images/logo.png" alt="" class="tran_logo_img">';
        tableRef += '</div>';


        tableRef += '<div class="mr-3 table_data_4">';
        tableRef += '<p>Sent to:</p>';
        tableRef += '<p>' + item.to + '</p>';
        tableRef += '</div>';
        tableRef += '<div class="mr-3 table_data_5">';

        tableRef += '<p class="sent_color"> ' + web3.utils.fromWei(web3.utils.toBN(item.value)).toString() + ' HLS</p>';
        tableRef += '</div>';
        tableRef += '<div class="align-self-center">';
        tableRef += '<button type="button" class="btn btn-transaction-complete btn-rounded">Complete <i class="uil uil-check-circle ml-1"></i></button>';
        tableRef += '</div>';
        tableRef += '</div>';
        if(i == 0){
             dis = "show";
        }else{
            dis = '';
        }
        tableRef += '<div id="alltrancollapseone' + item.timestamp + '" class="collapse col-12 dropdown-transaction '+dis+'" aria-labelledby="headingTwo" data-parent="#all_tran_1">';
        tableRef += '<div class="row">';
        tableRef += '<div class="col-12"><h1>Transaction Details</h1></div>';
        tableRef += '<div class="col-md-6 col-sm-12">';
        tableRef += '<p><strong>Token Name:</strong> Helios Protocol (HRS)</p>';
        tableRef += '<p><strong>Amount:</strong>' + web3.utils.fromWei(web3.utils.toBN(item.value)).toString() + ' HLS</p>';
        options = { day: 'numeric', year: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
        tableRef += '<p><strong>Date:</strong><span> ' + d.toLocaleString('en-US', options) + '</span></p>';
        tableRef += '<p><strong>Fees:</strong> ' + web3.utils.fromWei(web3.utils.toBN(item.gas_cost)).toString() + '</p>';
        tableRef += '</div>';
        tableRef += '<div class="col-md-6 col-sm-12">';
        tableRef += '<p><strong>From:</strong> ' + getAutocompleteStringFromAddressIfExist(item.from) + '</p>';
        tableRef += '<p><strong>To:</strong> ' + getAutocompleteStringFromAddressIfExist(item.to) + '</p>';
        tableRef += '<p><strong>Block Number:</strong> ' + item.block_number + '</p>';
        tableRef += '<p><strong>Block Final Balance:</strong> ' + web3.utils.fromWei(web3.utils.toBN(item.balance)).toString() + '</p>';
        tableRef += '</div>';
        tableRef += '</div>';
        tableRef += '</div>';
        $(".transaction_view").append(tableRef);
       
    });

    $('.preloader').hide();
}
async function populateOnlineKeystores(keystores, password) {
    // if(keystores.length > 0){
    //     for(var i = 0; i < keystores.length; i++){
    var i = 0;
    var keystore = keystores[i]['keystore'];
    var wallet_id = keystores[i]['id'];
    var wallet_name = keystores[i]['name'];
    var new_wallet = web3.eth.accounts.decrypt(JSON.parse(keystore), password, null, wallet_name);
    if (i === 0) {
        addOnlineWallet(new_wallet, wallet_id, wallet_name, false, keystores[i]);
    } else {
        addOnlineWallet(new_wallet, wallet_id, wallet_name, true);
    }
    // }
    return true
    //     }
}
async function refreshContactList() {
    $(".contact_div").remove();
    server.getContacts()
        .then(function (response) {
            if (response !== false && "success" in response) {
                ////console.log(response['contacts'].length);
                var contacts = response['contacts'];
                var html = '';
                contact_name_to_address_lookup = {};
                contact_address_to_name_lookup = {};
                contact_autocomplete_list = [];
                for (i = 0; i < response['contacts'].length; i++) {

                    html += '<div class="d-flex contact_div">';
                    html += '<div class="contact_table_1 align-self-center">';
                    html += '<p class="mb-0 mr-2">' + contacts[i]['name'] + '</p>';
                    html += '</div>';
                    html += '<div class="contact_table_2 align-self-center">';
                    html += ' <p class="mb-0 mr-2">' + contacts[i]['address'] + '</p>';
                    html += '</div>';
                    html += '<div class="contact_table_3">';
                    html += '<button class="btn btn-contact-remove btn-rounded" id="delete_contact" data-toggle="modal" data-target="#modal-remove-contact-wallet" data-id="' + contacts[i]['id'] + '" data-name="' + contacts[i]['name'] + '" data-address="' + contacts[i]['address'] + '" >Remove <i class="uil uil-trash-alt ml-1"></i></button>';
                    html += '</div>';
                    html += '</div>';
                    contact_name_to_address_lookup[contacts[i]['name']] = contacts[i]['address'];
                    contact_address_to_name_lookup[contacts[i]['address']] = contacts[i]['name'];
                    var autocomplete_entry = contacts[i]['name'] + " <" + contacts[i]['address'] + ">";
                    contact_autocomplete_list.push(autocomplete_entry);
                    contact_autocomplete_list_to_address_lookup[autocomplete_entry] = contacts[i]['address'];

                }
                $(html).insertAfter(".contact_head");
                return true;
            }
        });
}
$('body').on('click', '.delete_id', function (e) {
    var contact_id = $(this).data('id');
    //Need to sign in to confirm their username and password is correct before encrypting the keystore.
    server.deleteContact(contact_id)
        .then(function (response) {
            if (response !== false && "success" in response) {
                $('#modal-remove-contact-wallet').modal('hide');
                $("#modal-contact-remove-wallet-success").modal("toggle");
                refreshContactList();
                //popup("Contact deleted successfully.");
            } else {
                $('#modal-remove-contact-wallet').modal('hide');
                $("#modal-contact-remove-wallet-failed").modal("toggle");

                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                //popup(popup_content, 500);
            }
        });
});
$('body').on('click', ".btn-contact-remove", function () {
    var name = $(this).data('name');
    var address = $(this).data('address');
    $(".delete_modal_content #contact_name").text(name);
    $(".delete_modal_content #contact_address").text(address);
    $(".delete_id").attr("data-id", $(this).data('id'));
});
var set_balance_status = function (status) {
    $('#h-balance').text(status);
    $('.h-balance').text(status);
}
var set_connection_status = function (status, connected) {
    if (connected) {
        $('#connection_status_icon').attr('src', 'dist/assets/icon/node.png');
    } else {
        $('#connection_status_icon').attr('src', 'dist/assets/icon/x.png');
    }
    $('#connection_status').text(status);
}
var set_min_gas_price_status = function (status) {
    $('#min_gas_price_status').text(status);
    calculate_estimated_tx_fee_loop()
}
var set_account_status = function (address, name) {
    //console.log(address);
    //console.log(name);
    if (name === undefined) {
        $("#hls-name").text(name);
        $('#account_status').val(address);
        $('#account_status_paper').text(address);
        $('.paper_address').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + address);

    } else {
        $("#hls-name").text(name);
        $('#account_status').val(address);
        $('#account_status_paper').text(address);
        $('.paper_address').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + address);
    }

    if (web3 !== undefined && address !== undefined && web3.utils.isAddress(address.toLowerCase())) {
        $('.sending_account_copy').show().data('copy', address);
    } else {
        $('.sending_account_copy').hide().data('copy', '');
    }
}
var set_account_status_local_offline = function (address, name) {
    if (name === undefined) {
        $("#hls-name").text(name);
        $('#account_status').val(address);
        $('#account_status_paper').text(address);
        $('.paper_address').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + address);

    } else {
        $("#hls-name").text(name);
        $('#account_status').val(address);
        $('#account_status_paper').text(address);
        $('.paper_address').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + address);
    }

    if (web3 !== undefined && address !== undefined && web3.utils.isAddress(address.toLowerCase())) {
        $('.sending_account_copy').show().data('copy', address);
    } else {
        $('.sending_account_copy').hide().data('copy', '');
    }
}
var set_account_status_local = function (address, name) {
    if (name === undefined) {
        $("#hls-name").text(name);
        $('#account_status_local').val(address);
        $('#account_status_paper').text(address);
        $('.paper_address').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + address);

    } else {
        $("#hls-name").text(name);
        $('#account_status_local').val(address);
        $('#account_status_paper').text(address);
        $('.paper_address').attr("src", "https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=" + address);
    }

    if (web3 !== undefined && address !== undefined && web3.utils.isAddress(address.toLowerCase())) {
        $('.sending_account_copy').show().data('copy', address);
    } else {
        $('.sending_account_copy').hide().data('copy', '');
    }
}
function calculate_estimated_tx_fee_loop() {
    ////console.log($('#input_gas_price').val());
    var gas_val = $('#input_gas_price').val();
    if (gas_val != undefined) {
        var gas_price = web3.utils.toWei($('#input_gas_price').val(), 'gwei')
        gas_price = parseFloat(web3.utils.fromWei(web3.utils.toBN(gas_price), 'ether'));
        var tx_amount = $('#input_amount').val();
        var estimated_fee = Math.round(21000 * gas_price * 10000000) / 10000000;
        if (!isNaN(parseFloat(tx_amount)) && isFinite(tx_amount)) {
            var estimated_fee_percentage = Math.round(estimated_fee / tx_amount * 100000) / 100000 * 100;
        } else {
            var estimated_fee_percentage = 0;
        }
        $('.fee_estimation').text("Estimated fee per tx: " + estimated_fee + " or " + estimated_fee_percentage + "%")
        setTimeout(calculate_estimated_tx_fee_loop, 1000);
    }
}
async function receiveAnyIncomingTransactions(wallet_address, notify_if_none) {
    ////console.log("Getting receivable transactions")
    return web3.hls.getReceivableTransactions(wallet_address)
        .then(function (receivableTxs) {
            ////console.log('Finished getting receivable transactions')
            if (receivableTxs.length > 0) {
                return sendRewardBlock(wallet_address)
                    .then(function (res) {
                        alertify.success("You have received new transactions!");
                        return true;
                    });
            } else {
                if (notify_if_none) {
                    alertify.error("There are no new incoming transactions");
                }
                return false;
            }
        });
}
async function sendRewardBlock(address) {
    return web3.hls.sendRewardBlock(address)
        .then(function () {
            return true;
        })
        .catch(function (error) {
            return false;
        });
}
function getAddressFromAutocompleteStringIfExist(autocomplete_string) {
    if (!web3.utils.isAddress(autocomplete_string)) {
        if (autocomplete_string in contact_autocomplete_list_to_address_lookup) {
            return contact_autocomplete_list_to_address_lookup[autocomplete_string];
        }
    }
    return autocomplete_string;
}
function getSumPendingTransactionsCost() {
    var total_amount = web3.utils.toBN(0);
    pending_send_transactions.forEach(function (tx) {
        var gas_cost = web3.utils.toBN(tx.gas).mul(web3.utils.toBN(tx.gasPrice))
        total_amount = total_amount.add(web3.utils.toBN(tx.value)).add(web3.utils.toBN(gas_cost))
    });
    return total_amount;
}
var pending_send_transactions = [];
function add_transaction_to_block_from_form() {

    var amount = $('#input_amount').val();
    var to = $('#input_to').val();

    to = getAddressFromAutocompleteStringIfExist(to);

    var gas_price = $('#input_gas_price').val();
    var total_gas = parseInt($('#input_total_gas').val());

    if (!(validateInputs(amount, 'tx_amount') === true)) {
        alertify.error(validateInputs(amount, 'tx_amount'));
        return false;
    }
    if (!(validateInputs(gas_price, 'gas_price') === true)) {
        alertify.error(validateInputs(gas_price, 'gas_price'));
        return false;
    }
    if (!(validateInputs(total_gas, 'total_gas') === true)) {
        alertify.error(validateInputs(total_gas, 'total_gas'));
        return false;
    }

    if (!(validateInputs(to, 'wallet_address') === true)) {
        alertify.error(validateInputs(to, 'wallet_address'));
        return false;
    }

    amount = web3.utils.toWei(amount.toString(), 'ether');
    gas_price = web3.utils.toWei(gas_price.toString(), 'gwei');

    var transaction = {
        from: sending_account.address,
        to: to,
        value: amount,
        gas: total_gas.toString(),
        gasPrice: gas_price,
    }

    pending_send_transactions.push(transaction);

    refresh_pending_transaction_table();

    $('#input_amount').val("").trigger("change");
    $('#input_to').val("").trigger("change");
    //updateInputLabels();
    // //console.log(pending_send_transactions);
    return true;

}
function getAutocompleteStringFromAddressIfExist(address) {
    if (address in contact_address_to_name_lookup) {
        return contact_address_to_name_lookup[address] + " <" + address + ">";
    } else {
        return address
    }
}
function refresh_pending_transaction_table(table_id, include_delete_button) {
    if (table_id === undefined) {
        table_id = "multiple_transaction_list";
    }
    if (include_delete_button === undefined) {
        include_delete_button = true;
    }

    var tableRef = document.getElementById(table_id).getElementsByTagName('tbody')[0];

    //clear all rows
    tableRef.innerHTML = "";

    for (var i = 0; i < pending_send_transactions.length; i++) {
        var transaction = pending_send_transactions[i];
        var index = i;
        var to_shortened = getAutocompleteStringFromAddressIfExist(transaction.to);
        var amount_shortened = numerical.roundD(parseFloat(web3.utils.fromWei(transaction.value, 'ether')), 10);

        var row = tableRef.insertRow(tableRef.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        
        cell1.innerHTML = transaction.to;
        cell2.innerHTML = amount_shortened;
        cell3.innerHTML = web3.utils.fromWei(transaction.gasPrice, 'gwei'); //show in gwei
        cell4.innerHTML = transaction.gas;
        if (include_delete_button) {
            var cell5 = row.insertCell(4);
            cell5.innerHTML = '<button class="btn btn-contact-remove-table btn-rounded delete_transaction" id="delete_contact" data-index=' + index + ' data-address="0xd6a194963b479affb38b5c74782DFe4aE431713f">Remove <i class="uil uil-trash-alt ml-1"></i></button>';
        } else {
            
        }
        //show in wei
    }
}
var clear_vars = function (include_account = false) {
    if (include_account) {
        deleteAllOnlineWallets();
        deleteAllOfflineWallets();
        sending_account = null;
        available_offline_accounts = {};
        available_online_accounts = {};
        online_wallet_to_id_lookup = {};
        online_wallet_to_name_lookup = {};
    }
    pending_send_transactions = [];
    document.getElementById("multiple_transaction_list").getElementsByTagName('tbody')[0].innerHTML = "";
};
function validateInputs(value, type) {
    try {
        switch (type) {
            case "password":
                if (value === undefined || value === '') {
                    return "Password cannot be left blank";
                }
                if (value.length < 16) {
                    return "Password must be at least 16 characters long";
                }
                break;
            case "email":
                if (value === undefined || value === '') {
                    return "Email cannot be left blank";
                }
                if (!validateEmail(value)) {
                    return "Invalid email";
                }
                break;
            case "username":
                if (value === undefined || value === '') {
                    return "Username cannot be left blank";
                }
                break;
            case "wallet_name":
                if (value === undefined || value === '') {
                    return "Wallet name cannot be left blank";
                }
                break;
            case "contact_name":
                if (value === undefined || value === '') {
                    return "Contact name cannot be left blank";
                }
                if (value.length > 50) {
                    return "Contact name can be a maximum of 50 characters in length.";
                }
                break;
            case "wallet_address":
                if (value === undefined || value === '') {
                    return "Wallet address cannot be left blank";
                }
                if (!web3.utils.isAddress(value.toLowerCase())) {
                    if (!(value in contact_autocomplete_list_to_address_lookup)) {
                        return "The given wallet address is not a valid address or contact.";
                    }
                }
                break;
            case "tx_amount":
                if (value === undefined || value === '') {
                    return "Transaction amount cannot be left blank";
                }
                if (Number(value) === value && value % 1 === 0) {
                    //intiger
                    if (!web3.utils.toWei(web3.utils.toBN(value), 'ether').gt(web3.utils.toBN(1))) {
                        return "Transaction amount must be at least 1 wei.";
                    }
                } else {
                    //need to convert to wei
                    value = web3.utils.toWei(value.toString(), 'ether');
                    if (!web3.utils.toWei(web3.utils.toBN(value), 'ether').gt(web3.utils.toBN(1))) {
                        return "Transaction amount must be at least 1 wei.";
                    }
                }


                break;
            case "gas_price":
                if (value === undefined || value === '') {
                    return "Transaction gas price cannot be left blank";
                }
                if (!web3.utils.toWei(web3.utils.toBN(value), 'gwei').gt(web3.utils.toBN(1))) {
                    return "Transaction gas price must be at least 1 wei.";
                }
                break;
            case "total_gas":
                if (value === undefined || value === '') {
                    return "Transaction total gas cannot be left blank";
                }
                if (!Number.isInteger(value)) {
                    return "Transaction total gas must be an integer";
                }
                break;
            case "two_factor_code":
                if (value.trim().length > 6) {
                    return "Two factor must be less than 6 characters long.";
                }
                break;
        }
    } catch (err) {
        return "An error has occurred: " + err;
    }
    return true;
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function isPrivateKey(privateKey) {
    // check if it has the basic requirements of a private key
    if (!/^(0x)?[0-9a-f]{64}$/i.test(privateKey)) {
        return false;
        // If it's ALL lowercase or ALL upppercase
    }
    return true
}
function myFunctionCopy(element) {
    /* Get the text field */
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($("#account_status").val()).select();
    document.execCommand("copy");
    $temp.remove();
    alertify.success("Address copied to clipboard !");
}
function myFunctionCopy1(element) {
    /* Get the text field */
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($("#account_status_local").val()).select();
    document.execCommand("copy");
    $temp.remove();
    alertify.success("Address copied to clipboard !");
}