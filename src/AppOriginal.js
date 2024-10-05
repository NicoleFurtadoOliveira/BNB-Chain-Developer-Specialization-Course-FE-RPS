import "./App.css";
import React, {useState, useEffect} from "react";
import ActionButton from "./components/ActionButton"; 
import Player from "./components/Player";
import Button from "react-bootstrap/Button";
import ContractAbi from "./ContractAbi.json"; 
import InputGroup from "react-bootstrap/InputGroup"; 
import Form from "react-bootstrap/Form";
import { BrowserProvider } from "ethers";
const ethers = require("ethers") 

const App = () =>{
  const contractAddress = "";
  const [playerAction, setPlayerAction] = useState(""); 
  const [computerAction, setComputerAction] = useState(""); 
  const [betAmout, setBetAmount] = useState(0);

  const onActionSelected = (selectedAction) =>{
    setPlayerAction(selectedAction)
    setComputerAction("");
  };

  const [provider, setProvider] = useState();

  useEffect(() => {
    if (window.ethereum == null) {
        // If MetaMask is not installed, we use the default provider,
      // which is backed by a variety of third-party services (such
      // as INFURA). They do not have private keys installed,
      // so they only have read-only access
      console.log("MetaMask not installed; using read-only defaults")
      // provider = ethers.getDefaultProvider()
      setProvider(ethers.getDefaultProvider());
    } else {
    
        // Connect to the MetaMask EIP-1193 object. This is a standard
        // protocol that allows Ethers access to make all read-only
        // requests through MetaMask.
        // provider = new ethers.BrowserProvider(window.ethereum)
               const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        
        // It also provides an opportunity to request access to write
        // operations, which will be performed by the private key
        // that MetaMask manages for the user.
        provider.getSigner();
    }
  }, []);
  

  const [connButtonText, setConnButtonText] = useState("Connect to wallet"); 
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractChoice, setContractchoice] = useState(null);
  const [txHash, setTxHash] = useState(0);
  
  useEffect(() =>{connectwalletHandler();});

  const connectwalletHandler= () => { 
    if(window.ethereum) {
      provider.send("eth_requestAccounts", []).then(async () =>{ 
        await accountChangedHandler(provider.getSigner());
      });
    } else {
      alert("error connecting to the Wallet")  
    }
  };


  const accountChangedHandler = async (newAccount) =>{
    const address = await newAccount.getAddress(); 
    const balance = await newAccount.getBalance(); 
    setConnButtonText(address);
    setAccount(address);
    await getUserBalance(address);
    connectContract();
  };

  const getUserBalance = async (address ) =>{
    const balance = await provider.getBalance(address, "latest");
  };

  const connectContract = () =>{
    try{
      let tempProvider = new ethers.providers.web3Provider(window.ethereum);
      let tempsigner = tempProvider.getSigner();
      let tempContract = new ethers.Contract(
        contractAddress,
        ContractAbi,
        tempsigner
      );
      setContract(tempContract); 
    } catch(error) {
        alert(`An error accured when connecting to the smart contract ${error}`); 
        console.error("Error:", error);
    }
  };

  const play = async() =>{
    setComputerAction("");
    const overrides = {
      gasLimit: 200000,
      value: ethers.utils.parseEther (`${betAmout}`),
    };

    let choice = 3;
    if (playerAction == "rock") {
      choice = 1;
    } else if (playerAction == "paper"){
      choice = 2;
    }

    if (betAmout < 0.001 && playerAction == ""){
      alert("Bet Amount is too small or player action hasn't been chosen");
    } else {
      try{
        const transaction = await contract.play(choice, overrides);
        setTxHash(transaction.hash);
        console.log(`Transaction ${transaction.hash} complete!`);

        await transaction.wait();

        fetchContractChoice();
      }catch (error) {
        alert(`Failed transaction, please try again`); 
        console.error("Error:", error);
      }
    }
  };  

  const fetchContractChoice = () =>{
    try {
      const dataFromContract = contract.getCurrentChallengeStatus(account);

      console.log(`Whole data from cintract: ${dataFromContract}:
      Status: ${dataFromContract[0]};
      Player Choice: ${dataFromContract[3]};
      Contract Choice: ${dataFromContract[4]}`);

    } catch (error) {
      alert("An error occurred while fetching getCurrentChallengeStatus: ", error); 
      console.error("An error occurred while fetching getCurrentChallenge Status", error);
    };
  }

  const displayCompChoice = (resultFromContract) =>{
    let compChoice = "scissors";
    if (contractChoice == 1) {
      compChoice = "rock";
    } else if (contractChoice == 2) {
      compChoice = "paper"; 
    }
    setComputerAction (compChoice);
  };

  const handleChangeOnBet = (event) => {
    setBetAmount(event.target.value);
  };



  return (
    <div classname="center">
      <h1>Rock Paper Scissors</h1>
      <Button className="button-connect" variant="outline-primary" onclick={connectwalletHandler}>
        {connButtonText}
      </Button>{" "}
      <div>
          <div className="container">
            <Player name="Player" action={playerAction} />
            <Player name="Computer" action={computerAction} />
          </div>
          <div>
            <ActionButton action="rock" onActionSelected={onActionSelected} /> 
            <ActionButton action="paper" onActionSelected={onActionSelected} /> 
            <ActionButton action="scissors" onActionSelected={onActionSelected} />
          </div>
          <div className="inputs">
            <InputGroup className="mb-3">
              <InputGroup. Text id="inputGroup-sizing-default">Bet Amount</InputGroup.Text>
              <Form.Control
                aria-label="Bet Amount"
                aria-describedby="inputGroup-sizing-default"
                onChange={handleChangeOnBet}
                value={betAmout}
              />
            </InputGroup>
          </div>
          <Button variant="success" className="button-play" onclick={play}>Play!</Button>{" "} 
          <p>{`Latest transaction hash: ${txHash}`}</p>
      </div>
    </div>
  );
}

export default App;
