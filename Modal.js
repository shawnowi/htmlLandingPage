
class Modal extends React.Component {

    textInput = React.createRef()
    web3Connector = new Web3()
    walletConnector = new Web3()
    _targetChainID = 97
    _targetRPC = "https://data-seed-prebsc-1-s1.binance.org:8545/"
    
    constructor(props) { 
        super(props)
        this.state = {
            debug: '',
            modalIsOpened: false,
            wallet: -1,
            chainID: -1,
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

    async isWalletConnectedMobile() {
        return false
    }

    async isWalletConnected() {
        var debug = ''
        var accounts = []
        var chainID = -1

        try {

            if (this.web3Connector === undefined) {
                return isWalletConnectedMobile()
            }

            debug = debug + ' d1'
            switch (this.state.wallet) {
                case -1:

                    debug = debug + ' d2'
                    var acctWeb3 = await this.web3Connector.eth.getAccounts()
                    debug = debug + ' d3'
                    if (acctWeb3 !== undefined) {
                        debug = debug + ' d4'
                        if (acctWeb3.length !== 0) {
                            debug = debug + ' d5'
                            accounts = acctWeb3
                            debug = debug + ' d6'
                            chainID = await this.web3Connector.eth.getChainId()
                            debug = debug + ' d7'
                            this.setState({ wallet: 0 })
                            debug = debug + ' d8'
                        } else {
                            if (this.walletConnector.connected) {
                                debug = debug + ' d9'
                                var acctWalletConnect = await this.walletConnector.accounts
                                debug = debug + ' d10'
                                if (acctWalletConnect !== undefined) {
                                    debug = debug + ' d11'
                                    if (acctWalletConnect.length !== 0) {
                                        debug = debug + ' d12'
                                        accounts = acctWalletConnect
                                        debug = debug + ' d13'
                                        chainID = await this.walletConnector.chainId
                                        debug = debug + ' d14'
                                        this.setState({ wallet: 1 })
                                        debug = debug + ' d15'
                                    }
                                }
                            }
                        }
                    }
                    debug = debug + ' d16'
                    break
                case 0:
                    accounts = await this.web3Connector.eth.getAccounts()
                    chainID = await this.web3Connector.eth.getChainId()
                    break
                case 1:
                    if (this.walletConnector.connected) {
                        accounts = await this.walletConnector.accounts
                        chainID = await this.walletConnector.chainId
                    }
                    break
                default:
                    break
            }

            if (accounts !== undefined) {
                if (accounts.length !== 0) {
                    this.setState({ accounts: accounts })
                    this.setState({ chainID: chainID })
                    return true
                }
            }

            this.setState({ accounts: [] })
            this.setState({ chainID:-1 }) 
            this.setState({ wallet:-1 }) 
            return false
        } catch(error) {
            debug = debug + ' ' + error.description
        } finally {
            this.setState({ debug: debug })
        }
    }

    isTargetChainID() {
        if (this.state.chainID === this._targetChainID) {
            this.setState({ popupCode: 0 })
            return true
        } else {
            this.setState({ popupCode: 1 })
            return false
        }
    }

    async getWalletBalance() {
        switch (this.state.wallet) {
            case 0:
                await this.web3Connector.eth.getBalance(this.state.accounts[0]).then((bal) => {
                    this.setState({ walletBal: bal })
                })
                break
            case 1:
                const provider = new Web3.providers.HttpProvider(_targetRPC);
                const web3 = new Web3(provider)
                await web3.eth.getBalance(this.state.accounts[0]).then((bal) => {
                    this.setState({ walletBal: bal })
                })                
                break

            default:
                this.setState({ walletBal: 0 })
                break
        }
    }

    async metaMaskConnect() {
        this.setState({ popupCode: -1 })
        try {
            await window.ethereum.enable()
            this.setState({ wallet: 0 })
        } catch (e) {

        } finally {
            if (await this.isWalletConnected()) {
                this.isTargetChainID()
                await this.getWalletBalance()
            } else {
                this.setState({ popupCode: 7 })
                this.setState({ wallet: -1 })
            }
        }
    }

    async walletConnect() {
        this.setState({ popupCode: -1 })
    
        if (!this.walletConnector.connected) {
            this.walletConnector = new window.WalletConnect.default({
                bridge: 'https://bridge.walletconnect.org'
            })
        }

        if (!this.walletConnector.connected) { 
            await this.walletConnector.createSession()
        }
        
        window.WalletConnectQRCodeModal.default.open(this.walletConnector.uri, async () => {
            if (!this.walletConnector.connected) {
                this.setState({ popupCode: 7 })
                await this.walletConnector.killSession()
            }
        });

        await this.walletConnector.on("connect", async (error, payload) => {
            window.WalletConnectQRCodeModal.default.close();
            this.setState({ wallet: 1 })
            if (await this.isWalletConnected()) {
                if (this.isTargetChainID()) {
                    //await this.getWalletBalance()
                }
            } else {
                this.setState({ popupCode: 7 })
            }
        })

        await this.walletConnector.on("disconnect", async (error, payload) => {
            this.setState({ wallet: -1 })
            this.setState({ popupCode: 7 })
        })
    }

    async closeModal() {
        this.setState({ modalIsOpened: false })
    }
    
    async openModal() {

        if(isMobile) {
            console.log('true')
        } else {
            console.log("false")
        }

        // this.setState({ modalIsOpened: true })
        // if (await this.isWalletConnected()) {
        //     if (this.isTargetChainID()) {
        //         //await this.getWalletBalance()
        //     }
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
            <div>
                <p>{this.state.debug}</p>
                <button onClick={() => this.openModal()}>Buy Token</button>
            </div>
        )
    }
}

ReactDOM.render(<Modal />, document.getElementById('root'))