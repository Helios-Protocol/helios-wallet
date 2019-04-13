=================================
Helios Protocol Javascript Wallet
=================================
This is the beta version of the Helios Protocol testnet wallet. It is a package of tools that allow
the user to interact with the Helios Protocol decentralized network. Everything by design
runs on the client side to ensure security.

Helios Protocol also offers a service, integrated into
the wallet, that allows users to save their keystore into an online database to be retrieved
from any device. This is simply fo convenience. The keystores are encrypted on the client side
with a passphrase that is never transmitted over the internet. Helios protocol has absolutely
no possible way of accessing the keystores that are uploaded to the online database, and therefore
have no control over any funds and cannot recover keystores if passwords are lost. Always back
up your keystores using the functions in the wallet. It is your responsibility to keep back ups and
save your passwords in secure places.

Alternatively, this wallet also allows you to use it with locally saved keystore files that are
never transmitted over the internet. This is the most secure method of usage and we reccommend
it for long term storage.

Usage
-------
You can access this wallet from the Helios Protocol website at https://heliosprotocol.io/wallet.
However, if you would like to be extra cautious and avoid all possibilities of phishing,
you can download the wallet directly from our github here, and then run it from your computer
or device by opening the dist/index.html file. The wallet will work exactly the same as if
you went to the Helios Protocol website.

Developers
-----------
If you would like to develop this software, edit the files within the app directory, and then from within the root directory
run: $gulp from the command line. (Make sure you have gulp installed by running npm install gulp). After running
gulp, it will compile the website/wallet into the dist folder.