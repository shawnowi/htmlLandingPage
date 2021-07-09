class Modal extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            clicked: false,
            accounts: []
        }
    }

    async getWeb3() {
        await window.ethereum.enable();

        var web3 = new Web3(window.ethereum);

        const accounts = await web3.eth.getAccounts()
        this.setState({accounts: accounts})
    }

    async getWalletConnect() {

        var WalletConnect = window.WalletConnect.default
        var WalletConnectQRCodeModal = window.WalletConnectQRCodeModal.default

        var connector = new WalletConnect({
            bridge: 'https://bridge.walletconnect.org', qrcodeModal: WalletConnectQRCodeModal // Required
        });

        if (!connector.connected) {
            await connector.createSession();
        }
    }    

    myFunc() {
        this.getWeb3()
        this.getWalletConnect()
        this.setState({ clicked: true })
    }

    render() {

        if (this.state.clicked) {
            return this.state.accounts
        }

        return (
            React.createElement(
                'button',
                { onClick: () => this.myFunc() },
                'Buy Token'
            )
        )
    }
}

ReactDOM.render(React.createElement(Modal, null), document.getElementById('root'))