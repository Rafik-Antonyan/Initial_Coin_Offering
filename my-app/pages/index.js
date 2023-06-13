import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useRef, useState } from 'react';
import { BigNumber, utils, providers, Contract } from 'ethers';
import Web3Modal from 'web3modal';
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from '@/constants';

export default function Home() {
    const zero = BigNumber.from(0)
    const tokenPrice = 0.001
    const [loading, setLoading] = useState(false)
    const [currentAccount, setCurrentAccount] = useState(null)
    const [walletConnected, setWalletConnected] = useState(false)
    const [tokenAmount, setTokenAmount] = useState(zero)
    const [tokensMinted, setTokenMinted] = useState(zero)
    const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero)
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero)
    const web3ModalRef = useRef()

    const getBalanceOfCryptoDevTokens = async () => {
        try {
            const provider = await getProviderOrSigner()
            const contract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            )

            const signer = await getProviderOrSigner(true)
            const address = signer.getAddress()
            const balance = await contract.balanceOf(address)
            setBalanceOfCryptoDevTokens(balance)
        } catch (err) {
            console.error(err);
        }
    }

    const getTokensToBeClimed = async () => {
        try {
            const provider = await getProviderOrSigner()
            const nftContract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                provider
            )
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            )

            const signer = await getProviderOrSigner(true)
            const address = signer.getAddress()
            const balance = await nftContract.balanceOf(address)

            if (balance === zero) {
                setTokensToBeClaimed(zero)
            } else {
                let amount = 0
                for (let i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(address, i)
                    const climed = await tokenContract.tokenIdsClaimed(tokenId)
                    if (!climed) {
                        amount++
                    }
                }
                setTokensToBeClaimed(BigNumber.from(amount))
            }
        } catch (err) {
            console.error(err);
            setTokensToBeClaimed(zero)
        }
    }
    function handleAccountsChanged(accounts) {
        setCurrentAccount(accounts[0])
        setWalletConnected(false)
    }

    useEffect(() => {
        window.ethereum?.on('accountsChanged', handleAccountsChanged);
        return () => {
            window.ethereum?.on('accountsChanged', handleAccountsChanged);
        }
    }, [])

    const getTotalTokenMinted = async () => {
        try {
            const provider = await getProviderOrSigner()
            const contract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            )

            const _tokensMinted = await contract.totalSupply()
            setTokenMinted(_tokensMinted)
        } catch (err) {
            console.error(err);
        }
    }

    const mintCryptoDevToken = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            )
            const value = tokenPrice * tokenAmount
            const tx = await contract.mint(tokenAmount, {
                value: utils.parseEther(value.toString())
            })
            setLoading(true)
            await tx.wait()
            setLoading(false)
            alert("Successfully minted Crypto Dev Token")
            await getBalanceOfCryptoDevTokens();
            await getTotalTokenMinted();
            await getTokensToBeClimed()
        } catch (err) {
            console.error(err);
        }
    }

    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef.current.connect()
        const web3Provider = new providers.Web3Provider(provider)
        const { chainId } = await web3Provider.getNetwork()

        if (chainId !== 11155111) {
            alert('Change the network to sepolia')
            throw new Error("Change the network to sepolia")
        }

        if (needSigner) {
            const signer = web3Provider.getSigner()
            return signer
        }

        return web3Provider
    }

    const connectWallet = async () => {
        try {
            await getProviderOrSigner()
            setWalletConnected(true)
            await getBalanceOfCryptoDevTokens();
            await getTotalTokenMinted();
            await getTokensToBeClimed()
        } catch (err) {
            console.error(err);
            alert(err)
        }
    }

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "sepolia",
                providerOptions: {},
                disableInjectedProvider: false
            })
            connectWallet()
        }
    }, [walletConnected, currentAccount])

    const claimCryptoDevTokens = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            )

            const tx = await contract.claim()
            setLoading(true)
            await tx.wait()
            setLoading(false)
            alert("Successfully claimed Crypto Dev Tokens")
            await getBalanceOfCryptoDevTokens();
            await getTotalTokenMinted();
            await getTokensToBeClimed()
        } catch (err) {
            console.error(err);
        }
    }

    const renderButton = () => {
        if (loading) {
            return <div>
                <button disabled className={styles.button}>Loading...</button>
            </div>
        }
        if (tokensToBeClaimed > 0) {
            return <div>
                <div className={styles.description}>
                    {tokensToBeClaimed * 10} Tokens can be claimed!
                </div>
                <button className={styles.button} onClick={claimCryptoDevTokens} >Claim Tokens</button>
            </div>
        }
        return <div style={{ display: 'flex-col' }}>
            <div>
                <input type='number' placeholder='Amount of tokens' onChange={e => setTokenAmount(BigNumber.from(e.target.value))} />
                <button className={styles.button} disabled={!tokenAmount > 0} onClick={mintCryptoDevToken}>Mint Tokens</button>
            </div>
        </div>
    }

    return <div>
        <Head>
            <title>Crypto Devs ICO</title>
            <meta name='description' content='ICO=dApp' />
        </Head>
        <div className={styles.main}>
            <div>
                <h1 className={styles.title}>Welcome to Crypto Devs ICO</h1>
                <div className={styles.description}>
                    You can claim or mint CryptoDev tokenws here
                </div>
                {walletConnected
                    ?
                    <div>
                        <div className={styles.description}>
                            You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto Dev Tokens
                        </div>
                        <div className={styles.description}>
                            Overall {utils.formatEther(tokensMinted)}/10000 have been minted
                        </div>
                        {renderButton()}
                    </div>
                    :
                    <button onClick={connectWallet} className={styles.button}>
                        Connect your wallet
                    </button>
                }
            </div>
            <div>
                <img className={styles.image} src="0.svg" />
            </div>
        </div>
        <footer className={styles.footer}>
            Made With &#10084; by Crypto Devs
        </footer>
    </div>
}