
class Modal extends React.Component {

    textInput = React.createRef()
    web3Connector = new Web3()
    walletConnector = new Web3()

    _rate = 20000
    _targetChainId = 97 //bds testnet
    _bridge = "https://bridge.walletconnect.org"
    _targetRPC = "https://data-seed-prebsc-1-s1.binance.org:8545/" //bsc testnet
    _idoAddress = "0x06c395D51CAAB0581d19B54c44b04173a1c3035e" //bsc testnet
    _abi = [{"constant":true,"inputs":[],"name":"rate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"weiRaised","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"wallet","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"beneficiary","type":"address"}],"name":"buyTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"rate","type":"uint256"},{"name":"wallet","type":"address"},{"name":"token","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"purchaser","type":"address"},{"indexed":true,"name":"beneficiary","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"TokensPurchased","type":"event"}]; //bsc testnet
    _symbolsArr = ["e", "E", "+", "-"]

    constructor(props) {
        super(props)

        var md = new MobileDetect(window.navigator.userAgent);

        this.state = {
            isMobile: (md.mobile() !== null),
            debug: '',
            modalIsOpened: false,
            wallet: -1,
            chainId: -1,
            popupCode: -1,
            accounts: [],
            walletBalance: 0,
            rate: this._rate,
            totalToken: this._rate,
            disable: false,
            buttonText: 'Buy Token'
        }

        if (md.mobile() === null) {

            if (window.ethereum) {
                this.web3Connector = new Web3(window.ethereum)
            } else if (window.web3) {
                this.web3Connector = new Web3(web3.currentProvider)
            }

            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts[0] !== undefined) {
                    await this.setState({ accounts: accounts })
                    await this.getWalletBalance()
                } else {
                    this.setState({ wallet: -1 })
                    this.setState({ popupCode: 7 })
                }
            })

            window.ethereum.on('chainChanged', async (chainId) => {
                await this.setState({ chainId: parseInt(chainId) })
                this.isTargetChainId()
            })
        }

        this.walletConnectInit()
    }

    async walletConnectInit() {
        if (!this.walletConnector.connected) {
            this.walletConnector = new WalletConnect.default({
                bridge: this._bridge, qrcodeModal: WalletConnectQRCodeModal.default
            })
        }
        this.walletConnector.on("connect", async (error, payload) => {
            this.setState({ wallet: 1 })
            if (await this.isWalletConnected()) {
                if (this.isTargetChainId()) {
                    await this.getWalletBalance()
                }
            } else {
                this.setState({ popupCode: 7 })
            }
        })
        this.walletConnector.on("disconnect", async (error, payload) => {
            this.setState({ wallet: -1 })
            this.setState({ popupCode: 7 })
        })
        
        this.walletConnector.on("session_update", async (error, payload) => {
            const { accounts, chainId } = payload.params[0]
            this.setState({ accounts: accounts })
            this.setState({ chainId: chainId })
            if (this.isTargetChainId()) {
                this.getWalletBalance()
            }
        });
    }

    async isWalletConnectedMobile() {
        var accounts = []
        var chainId = -1

        if (this.walletConnector.connected) {
            var acctWalletConnect = await this.walletConnector.accounts
            if (acctWalletConnect[0] !== undefined) {
                accounts = acctWalletConnect
                chainId = await this.walletConnector.chainId
                this.setState({ wallet: 1 })
            }
        }

        if (accounts[0] !== undefined) {
            this.setState({ accounts: accounts })
            this.setState({ chainId: chainId })
            return true
        }

        this.setState({ accounts: [] })
        this.setState({ chainId:-1 }) 
        this.setState({ wallet:-1 }) 
        return false
    }

    async isWalletConnected() {

        var accounts = []
        var chainId = -1

        if (this.state.isMobile === true) {
            return this.isWalletConnectedMobile()
        }

        switch (this.state.wallet) {
            case -1:
                var acctWeb3 = await this.web3Connector.eth.getAccounts()
                if (acctWeb3[0] !== undefined) {
                    accounts = acctWeb3
                    chainId = await this.web3Connector.eth.getChainId()
                    this.setState({ wallet: 0 })
                } else {
                    if (this.walletConnector.connected) {
                        var acctWalletConnect = await this.walletConnector.accounts
                        if (acctWalletConnect[0] !== undefined) {
                            accounts = acctWalletConnect
                            chainId = await this.walletConnector.chainId
                            this.setState({ wallet: 1 })
                        }
                    }
                }
                break
            case 0:
                accounts = await this.web3Connector.eth.getAccounts()
                chainId = await this.web3Connector.eth.getChainId()
                break
            case 1:
                if (this.walletConnector.connected) {
                    accounts = await this.walletConnector.accounts
                    chainId = await this.walletConnector.chainId
                }
                break
            default:
                break
        }

        if (accounts[0] !== undefined) {
            this.setState({ accounts: accounts })
            this.setState({ chainId: chainId })
            return true
        }

        this.setState({ accounts: [] })
        this.setState({ chainId:-1 }) 
        this.setState({ wallet:-1 }) 
        return false
    }

    isTargetChainId() {
        if (this.state.chainId === this._targetChainId) {
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
                    this.setState({ walletBalance: bal })
                })
                break
            case 1:
                const provider = new Web3.providers.HttpProvider(this._targetRPC);
                const web3 = new Web3(provider)
                await web3.eth.getBalance(this.state.accounts[0]).then((bal) => {
                    this.setState({ walletBalance: bal })
                })                
                break

            default:
                this.setState({ walletBalance: 0 })
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
                if (this.isTargetChainId()) {
                    await this.getWalletBalance()
                }
            } else {
                this.setState({ popupCode: 7 })
                this.setState({ wallet: -1 })
            }
        }      
    }

    async walletConnect() {
        this.setState({ popupCode: -1 })

        this.walletConnectInit()
          
        if (!this.walletConnector.connected) { 
            await this.walletConnector.createSession()
        }  
    }

    async closeModal() {
        this.setState({ modalIsOpened: false })
        this.setState({ popupCode: -1 })
    }
    
    async openModal() {

        this.setState({ modalIsOpened: true })
        if (await this.isWalletConnected()) {
            if (this.isTargetChainId()) {
                await this.getWalletBalance()
            }
        } else {
            if (this.state.isMobile) {
                this.walletConnect()
            } else {
                this.setState({ popupCode: 6 })
            }
        }
    }

    async buyToken() {

        if (!await this.isWalletConnected()) {
            return
        }
        if (!this.isTargetChainId()) {
            return
        }

        await this.setState({ disable: true})
        await this.setState({ buttonText: "transaction in progress, please wait ..."})        
        
        if (this.state.wallet === 0) {

            const web3 = new Web3(window.ethereum)
            const idoContract = new web3.eth.Contract(this._abi, this._idoAddress);
            await idoContract.methods.buyTokens(this.state.accounts[0]).send({
                from: this.state.accounts[0],
                value: parseFloat(this.textInput.current.value) * 10 ** 18
            }).then((result) => {
                this.setState({ popupCode: 4 })
            }).catch((error) => {
                this.setState({ popupCode: 3 })
            })

        } else if (this.state.wallet === 1) {
            const provider = new Web3.providers.HttpProvider(this._targetRPC);
            const web3 = new Web3(provider)
            const idoContract = new web3.eth.Contract(this._abi, this._idoAddress);

            const func = idoContract.methods.buyTokens(this.state.accounts[0]).encodeABI()
            const tx = {
                from: this.state.accounts[0],
                to: idoContract.options.address,
                data: func,
                value: (parseFloat(this.textInput.current.value) * 10 ** 18).toString()
            }

            console.log("test")

            await this.walletConnector.sendTransaction(tx).then((result) => {
                this.setState({ popupCode: 4 })
            }).catch((error) => {
                console.log(error)
                this.setState({ popupCode: 3 })
            });         
        }
        await this.setState({ disable: false})
        await this.setState({ buttonText: "Buy Token" })
    }

    render() {

        let title = ''
        let body = ''
        let footer = ''

        switch (this.state.popupCode) {
            case -1:
                title = <h1>Connecting to your <br /> Wallet Provider !!</h1>
                body = <p>Please wait ...</p>
                break    
            case 0:
                title = <h1>Buy your SHIBALANCE</h1>
                body = 
                    <p>
                        {parseFloat(this.state.walletBalance / 10 ** 18).toFixed(2)} BNB available in your wallet<br /><br />
                        I want to send &nbsp;
                        <input
                            ref={this.textInput}
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            max="5"
                            defaultValue="1.00"
                            disabled={this.state.disable}
                            style={{size:28, fornName:"Century Gothic", fontWeight:"bold", height: 35, width: 60, textAlign: 'center'}} 
                            onKeyDown={e => this._symbolsArr.includes(e.key) && e.preventDefault()}
                            onClick={() => {
                                this.setState({ totalToken: parseFloat(this.textInput.current.value).toFixed(2) * this.state.rate})
                            }}
                            onBlur={() => {
                                if(parseFloat(this.textInput.current.value) === 0) {
                                    this.textInput.current.value = "0.01"
                                }
                                if(parseFloat(this.textInput.current.value) > 5) {
                                    this.textInput.current.value = "5"
                                }                            
                                this.setState({ totalToken: parseFloat(this.textInput.current.value).toFixed(2) * this.state.rate})
                                this.textInput.current.value = parseFloat(this.textInput.current.value).toFixed(2)
                            }}
                        /> &nbsp; BNB<br /><br />
                        You will get {parseFloat(this.state.totalToken).toFixed(0)} SHIBALANCE Token<br /><br />
                        <i>Note: please keep some BNB to pay the Gas Fee.</i>
                    </p>
                footer = <button disabled={this.state.disable} style={{width: 380}} onClick={() => {this.buyToken();}}>{this.state.buttonText}</button>
                break
            case 1:
                title = <h1>Wrong Network Selected !!</h1>;
                body = <p>You must use BSC (Binance Smart Chain) <br /> Mainnet Network to connect to the website.</p>
                break
            case 3:
                title = <h1>Transaction Cancelled !!</h1>
                body = <p>The transaction has been cancelled. <br />No BNB amount was sent.</p>
                break
            case 4:
                title = <h1>Successfully Purchased !!</h1>
                body = <p>The transaction was sent successfully. <br /><br /> Now that you are officially part of the <br /> SHIBALANCE community! </p>
                break
            case 6:
                title = ""
                body = <p><button onClick={() => this.metaMaskConnect()}>MetaMask</button><br /><br />
                <button onClick={() => this.walletConnect()}>Wallet Connect</button></p>
                break    
            case 7:
                title = <h1>Wallet Provider <br /> is not connected !!</h1>
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
                <div className="container">
                    <div className="vertical-center">
                        <button  onClick={() => this.openModal()}>Buy Token</button>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<Modal />, document.getElementById('root'))