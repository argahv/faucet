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
    isProviderLoaded: false,
  });

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [shouldReloadEffect, setShouldReloadEffect] = useState(false);

  const canConnectToContract = account && web3Api.contract;

  const reloadEffect = useCallback(
    () => setShouldReloadEffect(!shouldReloadEffect),
    [shouldReloadEffect]
  );

  const setAccountListener = useCallback(async (provider) => {
    provider.on("accountsChanged", (_) => {
      window.location.reload();
    });

    provider.on("chainChanged", (_) => {
      window.location.reload();
    });

    // provider._jsonRpcConnection.events.on("notification", (payload) => {
    //   const { method } = payload;
    //   if (method === "metamask_unlockStateChanged") {
    //     setAccount(null);
    //   }
    // });
  }, []);

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();

      if (provider) {
        const contract = await loadContract("Faucet", provider);

        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
          isProviderLoaded: true,
        });
        setAccountListener(provider);
      } else {
        setWeb3Api((prev) => ({ ...prev, isProviderLoaded: true }));
        console.error("Please, install Metamask.");
      }
    };

    loadProvider();
  }, [setAccountListener]);

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
          {web3Api.isProviderLoaded ? (
            <div className='is-flex is-align-items-center'>
              <span>
                <strong className='mr-2'>Account: </strong>
              </span>
              {account ? (
                <div>{account}</div>
              ) : !web3Api.provider ? (
                <div className='notification is-warning is-small is-rounded'>
                  Wallet Not Detected.{"  "}
                  <a
                    target='_blank'
                    href='https://docs.metamask.io'
                    rel='noreferrer'>
                    Install Metamask
                  </a>{" "}
                </div>
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
          ) : (
            <div className=''>Looking for web3...</div>
          )}
          <div className='balance-view is-size-2 my-4'>
            Current Balance: <strong>{balance}</strong> ETH
          </div>
          {!canConnectToContract && (
            <div>Please, connect to Ganache network</div>
          )}

          <button
            disabled={!canConnectToContract}
            onClick={addFunds}
            className='button is-large is-primary'>
            Donate 1eth
          </button>
          <button
            disabled={!canConnectToContract}
            onClick={withdraw}
            className='button is-large '>
            Withdraw 0.1eth
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
