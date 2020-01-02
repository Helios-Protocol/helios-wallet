function validateInputs(value, type){
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
    }catch(err){
        return "An error has occurred: "+err;
    }
    return true;
}