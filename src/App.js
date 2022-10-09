import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "./utils/load-contract";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    web3: null,
    contract: null,
  });

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [shouldReloadEffect, setShouldReloadEffect] = useState(false);

  const reloadEffect = useCallback(
    () => setShouldReloadEffect(!shouldReloadEffect),
    [shouldReloadEffect]
  );

  const setAccountListener = useCallback(
    async (provider) => {
      provider.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        reloadEffect();
      });
    },
    [reloadEffect]
  );

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();
      const contract = await loadContract("Faucet", provider);

      if (provider) {
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
        });
        setAccountListener(provider);
      } else {
        console.error("Please, install Metamask.");
      }
    };

    loadProvider();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      const { web3, contract } = web3Api;

      const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance, "ether"));
    };

    web3Api.contract && loadBalance();
  }, [web3Api, shouldReloadEffect]);

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };

    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api;

    await contract.addFunds({
      from: account,
      value: web3.utils.toWei("1", "ether"),
    });

    reloadEffect();
  }, [web3Api, account, reloadEffect]);

  const withdraw = useCallback(async () => {
    const { contract, web3 } = web3Api;

    const withdrawAmount = web3.utils.toWei("0.1", "ether");

    await contract.withdraw(withdrawAmount, {
      from: account,
    });

    reloadEffect();
  }, [web3Api, account, reloadEffect]);

  return (
    <>
      <div className='faucet-wrapper'>
        <div className='faucet'>
          <div className='is-flex is-align-items-center'>
            <span>
              <strong className='mr-2'>Account: </strong>
            </span>
            {account ? (
              <div>{account}</div>
            ) : (
              <button
                className='button is-small'
                onClick={() =>
                  web3Api.provider.request({ method: "eth_requestAccounts" })
                }>
                Connect Wallet
              </button>
            )}
          </div>
          <div className='balance-view is-size-2 my-4'>
            Current Balance: <strong>{balance}</strong> ETH
          </div>
          <button onClick={addFunds} className='button is-large is-primary'>
            Donate 1eth
          </button>
          <button onClick={withdraw} className='button is-large '>
            Withdraw 0.1eth
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
