var fileSaver = require("file-saver");

if (typeof window !== 'undefined') {
    if (typeof window.fileSaver === 'undefined'){
        window.fileSaver = fileSaver;
    }
}

module.exports = fileSaver;