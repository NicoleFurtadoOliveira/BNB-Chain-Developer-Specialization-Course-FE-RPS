import "./App.css";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import ActionButton from "./components/ActionButton";
import Player from "./components/Player";
import Button from "react-bootstrap/Button";
import ContractAbi from "./ContractAbi.json";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";

const App = () => {
  const contractAddress = "0x287977aD5c9343780fd2BaF234da469a87946166";
  const [playerAction, setPlayerAction] = useState("");
  const [computerAction, setComputerAction] = useState("");
  const [betAmount, setBetAmount] = useState(0);
  const [provider, setProvider] = useState(null);
  const [connButtonText, setConnButtonText] = useState("Connect to wallet");
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractChoice, setContractChoice] = useState(null);
  const [txHash, setTxHash] = useState(0);
  const [contractAbi, setContractAbi] = useState(null);

  useEffect(() => {
    const initializeProvider = () => {
      if (window.ethereum == null) {
        console.log("MetaMask not installed; using read-only defaults");
        setProvider(ethers.getDefaultProvider());
      } else {
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);
      }
    };

    initializeProvider();
  }, []);

  useEffect(() => {
    // Load the ABI when the component mounts
    const loadContractAbi = async () => {
      try {
        // If ContractAbi is already an object, use it directly
        if (typeof ContractAbi === 'object' && ContractAbi !== null) {
          setContractAbi(ContractAbi);
        } else {
          // If it's a JSON string, parse it
          const parsedAbi = JSON.parse(ContractAbi);
          setContractAbi(parsedAbi);
        }
      } catch (error) {
        console.error("Error loading contract ABI:", error);
        alert("Error loading contract ABI. Please check the console for details.");
      }
    };

    loadContractAbi();
  }, []);

  const onActionSelected = (selectedAction) => {
    setPlayerAction(selectedAction);
    setComputerAction("");
  };

  const connectWalletHandler = async () => {
    if (window.ethereum) {
      try {
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        await accountChangedHandler(signer);
      } catch (error) {
        console.error("Error connecting to the wallet:", error);
        alert("Error connecting to the wallet: " + error.message);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const accountChangedHandler = async (newAccount) => {
    const address = await newAccount.getAddress();
    setConnButtonText(address);
    setAccount(address);
    await getUserBalance(address);
    connectContract(newAccount);
  };

  const getUserBalance = async (address) => {
    if (provider) {
      const balance = await provider.getBalance(address, "latest");
      console.log("User balance:", ethers.formatEther(balance));
    }
  };

  const connectContract = (signer) => {
    if (!contractAbi) {
      console.error("Contract ABI not loaded");
      alert("Contract ABI not loaded. Please try again.");
      return;
    }

    try {
      const tempContract = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );
      setContract(tempContract);
      console.log("Contract connected successfully");
    } catch (error) {
      console.error("Error connecting to the smart contract:", error);
      alert(`An error occurred when connecting to the smart contract: ${error.message}`);
    }
  };

  const play = async () => {
    if (!contract) {
      alert("Please connect your wallet first!");
      return;
    }

    setComputerAction("");
    const overrides = {
      gasLimit: 200000,
      value: ethers.parseEther(`${betAmount}`),
    };

    let choice = 3;
    if (playerAction === "rock") {
      choice = 1;
    } else if (playerAction === "paper") {
      choice = 2;
    }

    if (betAmount < 0.001 || playerAction === "") {
      alert("Bet Amount is too small or player action hasn't been chosen");
    } else {
      try {
        const transaction = await contract.play(choice, overrides);
        setTxHash(transaction.hash);
        console.log(`Transaction ${transaction.hash} complete!`);

        await transaction.wait();

        fetchContractChoice();
      } catch (error) {
        console.error("Error during play:", error);
        alert(`Failed transaction, please try again: ${error.message}`);
      }
    }
  };

  const fetchContractChoice = async () => {
    try {
      const dataFromContract = await contract.getCurrentChallengeStatus(account);
      console.log(`Whole data from contract:`, dataFromContract);
      setContractChoice(dataFromContract[4]);
      displayCompChoice(dataFromContract[4]);
    } catch (error) {
      console.error("An error occurred while fetching getCurrentChallengeStatus:", error);
      alert("An error occurred while fetching getCurrentChallengeStatus: " + error.message);
    }
  };

  const displayCompChoice = (resultFromContract) => {
    let compChoice = "scissors";
    if (resultFromContract === 1) {
      compChoice = "rock";
    } else if (resultFromContract === 2) {
      compChoice = "paper";
    }
    setComputerAction(compChoice);
  };

  const handleChangeOnBet = (event) => {
    setBetAmount(event.target.value);
  };

  return (
    <div className="center">
    <h1>Rock Paper Scissors</h1>
    <Button
      className="button-connect"
      variant="outline-primary"
      onClick={connectWalletHandler}
    >
      {connButtonText}
    </Button>
    <div className="game-container">
      <div className="container">
        <div className={`player ${playerAction ? 'active' : ''}`}>
          <h2>Player</h2>
          <p>{playerAction || '?'}</p>
        </div>
        <div className={`player ${computerAction ? 'active' : ''}`}>
          <h2>Computer</h2>
          <p>{computerAction || '?'}</p>
        </div>
      </div>
      <div className="action-buttons">
        <ActionButton className="action-button" action="rock" onActionSelected={onActionSelected} />
        <ActionButton className="action-button" action="paper" onActionSelected={onActionSelected} />
        <ActionButton className="action-button" action="scissors" onActionSelected={onActionSelected} />
      </div>
      <div className="inputs">
        <InputGroup className="mb-3">
          <InputGroup.Text id="inputGroup-sizing-default">Bet Amount</InputGroup.Text>
          <Form.Control
            aria-label="Bet Amount"
            aria-describedby="inputGroup-sizing-default"
            onChange={handleChangeOnBet}
            value={betAmount}
          />
        </InputGroup>
      </div>
      <Button variant="success" className="button-play" onClick={play}>
        Play!
      </Button>
      {txHash && <p className="transaction-hash">{`Latest transaction hash: ${txHash}`}</p>}
    </div>
  </div>
  );
};

export default App;