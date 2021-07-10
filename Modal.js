
class Modal extends React.Component {

    textInput = React.createRef()
    web3Connector = new Web3()
    walletConnector = new Web3()
    _targetChainID = 97
    
    constructor(props) { 
        super(props)
        this.state = {
            modalIsOpened: false,
            wallet: -1,
            popupCode: -1,
            accounts: [],
            walletBalance: 10000,
            rate: 20000,
            totalToken: 0,
            disable: false,
            buttonText: 'Buy Token'
        }

        if (window.ethereum) {
            this.web3Connector = new Web3(window.ethereum)
        } else if (window.web3) {
            this.web3Connector = new Web3(web3.currentProvider)
        }
    }

    async isWalletConnected() {        
        var accounts = await this.web3Connector.eth.getAccounts()

        if (accounts.length !== 0) {
            this.setState({ wallet: 0 })
        } else if (this.walletConnector.connected) {
            this.setState({ wallet: 1 })
        } else  {
            this.setState({ wallet: -1 })
        }
        return (accounts.length !== 0 || this.walletConnector.connected)
    }

    async isTargetChainID() {
        var chainID = -1
        switch (this.state.wallet) {

            case 0:
                chainID = await this.web3Connector.eth.getChainId()
                break
            case 1:
                chainID = await this.walletConnector.chainId
                break

            default:
                chainID = -1
                break
        }
        return (chainID === this._targetChainID)
    }

    async checkChainID() {
        if (await this.isTargetChainID()) {
            this.setState({ popupCode: 0 })
        } else {
            this.setState({ popupCode: 1 })
        }
    }

    async getWalletBalance() {

        //web3 = new Web3('https://apis.ankr.com/6561e48b956b46fcb6cbb9c20a982919/c7b73503ab9a311d3888f859b1c619c0/binance/full/test')
        var accounts = []
        var walletBal = 0
        switch (this.state.wallet) {

            case 0:
                accounts = await this.web3Connector.eth.getAccounts()
                break
            case 1:
                accounts = await this.walletConnector.accounts
                break

            default:
                accounts = []
                break
        }

        if (accounts.length !== 0) {
            walletBal = await web3.eth.getBalance(accounts[0]);
        }
        
        console.log(walletBal)
    }

    async metaMaskConnect() {
        this.setState({ popupCode: -1 })
        try {
            await window.ethereum.enable()
        } catch (e) {

        } finally {
            if (await this.isWalletConnected()) {
                this.setState({ wallet: 0 })
                await this.checkChainID()
                await this.getWalletBalance()
            } else {
                this.setState({ popupCode: 7 })
                this.setState({ wallet: -1 })
            }
        }
    }

    async walletConnect() {

        if (this.walletConnector.connected) {
            await this.walletConnector.killSession()
        }

        this.walletConnector = new window.WalletConnect.default({
            bridge: 'https://bridge.walletconnect.org', qrcodeModal: window.WalletConnectQRCodeModal.default
        })

        await this.walletConnector.createSession()

        await this.walletConnector.on("connect", async (error, payload) => {
            if (await this.isWalletConnected()) {
                await this.checkChainID()
                await this.getWalletBalance()
                await this.setState({ wallet: 1 })
            } else {
                this.setState({ popupCode: 7 })
            }
        })

        await this.walletConnector.on("disconnect", async (error, payload) => {
            this.setState({ wallet: -1 })
            this.setState({ popupCode: 7 })
        })
    }

    closeModal() {
        this.setState({ modalIsOpened: false })
    }
    
    async openModal() {

        var aaa = new Web3(web3.currentProvider)
        var walletBal = await aaa.eth.getBalance('0x7F3b64B67a841630fBE6e8A0Ca813e0FF467974E');
        window.alert(walletBal)
        // this.setState({ modalIsOpened: true })
        // if (await this.isWalletConnected()) {
        //     await this.checkChainID()
        //     await this.getWalletBalance()
        // } else {
        //     this.setState({ popupCode: 6 })
        // }
    }

    async buyToken() {

        if (await this.isWalletConnected()) {
            await this.checkChainID()
        } else {
            this.setState({ popupCode: 6 })
        }

        this.setState({ disable: true})
        this.setState({ buttonText: "Transaction in progress, please wait ..."})
    }

    render() {

        let title = ''
        let body = ''
        let footer = ''

        switch (this.state.popupCode) {
            case -1:
                title = <h1>Connecting to your wallet !</h1>
                body = <p>Please wait ...</p>
                break    
            case 0:
                title = <h1>Buy your Token</h1>
                body = 
                    <p>
                        {this.state.walletBalance} BNB (BSC / BEP-20) available in your wallet<br /><br /><br />
                        I want to send &nbsp;
                        <input
                            ref={this.textInput}
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            max="5"
                            defaultValue="1.00"
                            style={{size:20, fontWeight:"bold", height: 50, width: 100, textAlign: 'center'}} 
                            onKeyDown={e => symbolsArr.includes(e.key) && e.preventDefault()}
                        /> &nbsp; BNB<br /><br /><br />
                        You will get {parseFloat(this.state.totalToken).toFixed(0)} Token<br /><br /><br />
                        <i>Please note that you must keep a small amount of BNB to pay the Gas Fee.</i>
                    </p>
                footer = <button disabled={this.state.disable} style={{width: 500}} onClick={() => {this.buyToken();}}>{this.state.buttonText}</button>
                break
            case 1:
                title = <h1>Wrong network selected !</h1>;
                body = <p>You must use BSC (Binance Smart Chain) Testnet network to connect to the website.</p>
                break
            case 2:
                title = <h1>There is problem accessing your Wallet !</h1>
                body = <p>Please check your Wallet and make sure it's ready for the purchase.</p>
                break
            case 3:
                title = <h1>transaction canceled !</h1>
                body = <p>The transaction has been cancelled. No amount was sent.</p>
                break
            case 4:
                title = <h1>Successful purchased !</h1>
                body = <p>The transaction was sent successfully. And now that you are officially part of the community, speard the World.</p>
                break
            case 5:
                title = <h1>There is some problem with your wallet !</h1>
                body = <p>Please check and make sure that you logon to your wallet and ready for transaction.</p>
                break
            case 6:
                title = ""
                body = <p><button onClick={() => this.metaMaskConnect()}>MetaMask</button><br /><br />
                <button onClick={() => this.walletConnect()}>Wallet Connect</button></p>
                break    
            case 7:
                title = <p>No wallet provider connected !</p>
                body = <p>We are unable to access to your wallet provider.</p>

                break                                  
            default:
                break
        }        

        if (this.state.modalIsOpened) {
            return (
                <div className="modalBackground">
                <div className="modalContainer">
                    <div className="titleCloseBtn">
                    <button
                        onClick={() => this.closeModal()}
                    >
                        X
                    </button>
                    </div>
                    <div className="title">
                        {title}
                    </div>
                    <div className="body">
                        {body}
                    </div>                
                    <div className="footer">
                        {footer}
                    </div>
                </div>
                </div>
            )
        }

        return (
            <button onClick={() => this.openModal()}>Buy Token</button>
        )
    }
}

ReactDOM.render(<Modal />, document.getElementById('root'))