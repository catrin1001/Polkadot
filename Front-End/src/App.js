import React from "react";
import { BigNumber, ethers } from "ethers";
import {abi} from "./escrowabi.js"

function configureContract (){

  const escrowAddress = "0x1906ae8FEb2d8b41f954DfC4a6a6e4D8ddc95d56";
  if (!window.ethereum){
    throw new Error("No crypto wallet found. Please install it.");
  }
  window.ethereum.request({ method: 'eth_requestAccounts'})
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(escrowAddress, abi, signer);
  return contract;
}

export default function App() {
 
  const [startTime,setstartTime] = React.useState();
  const [timeleft,settimeleft] = React.useState();
  const [curnttime,setcurnttime] = React.useState();
  const [timeLock, settimeLock] = React.useState();
  const [vaultBalance, setvaultBalance] = React.useState();
  const [ethValue, setEthValue] = React.useState(60);
  
  const [timer, setTimer] = React.useState();
  const id =React.useRef(null);
  const clear=()=>{
  window.clearInterval(id.current)}

  React.useEffect(()=>{
    id.current=window.setInterval(()=>{
     setTimer((time)=>time-1)
   },1000)
   return ()=>clear();
 },[])

 React.useEffect(()=>{
   if(timer === 0){
     clear()
   }

 },[timer])

  React.useEffect(() => {

      const contract = configureContract();
      const locktimePromise = new Promise((resolve, reject) => { 
        resolve(contract.lockTime());  
      });
      const starttimePromise = new Promise((resolve, reject) => { 
        resolve(contract.start());  
      });
      const balPromise = new Promise((resolve, reject) => { 
        resolve(contract.balance());  
      });
      Promise.all([locktimePromise, starttimePromise, balPromise]).then((values) => {
        console.log(values[0]);
        setvaultBalance(Number(ethers.BigNumber.from(values[2]).toString()));
        console.log(Number(ethers.BigNumber.from(values[1]).toString()) + Number(ethers.BigNumber.from(values[0]).toString()) - Math.floor((new Date()).getTime() / 1000));
        setTimer(Number(ethers.BigNumber.from(values[1]).toString()) + Number(ethers.BigNumber.from(values[0]).toString()) - Math.floor((new Date()).getTime() / 1000));
      });
     
  }, []);


  const handleSendPayment = async (e) => {
    e.preventDefault();
    const contract = configureContract();
    const myPromise = new Promise((resolve, reject) => {  
      resolve(contract.SendPayment({value: ethValue}));  
    });
    myPromise.then( ()=>{
      setvaultBalance(Number(ethers.BigNumber.from(contract.balance()).toString()));
      console.log();
    });
  }

  const handleClaimPayment = async (e) => {
    e.preventDefault();
    const contract = configureContract();
    const tx = await contract.ClaimPayment();  
  }

  const handleConfirmDeliver = async (e) => {
    e.preventDefault();
    const contract = configureContract();
    const tx = await contract.ConfirmDeliver(); 
  }

  const handleDenyDeliver = async (e) => {
    e.preventDefault();
    const contract = configureContract();
    const tx = await contract.DenyDeliver();   
  }

  const handleAgentTransfer = async (e) => {
    e.preventDefault();
    const contract = configureContract();
    const tx = await contract.AgentTransfer();   
  }

  const handleStatus = async (e) => {
    e.preventDefault();
    const contract = configureContract();
    console.log( await contract.status());
  }

  return (
    <div>
      <div>Time left : {timer} </div>
      <div>Vault Balance: {vaultBalance}</div>
      <input id="ethValue" type="text" label="Deposit Amount" onChange={event => setEthValue(event.target.value)}/><br/>
      <button onClick= {handleSendPayment}> Send Payment</button><br/>
      <button onClick= {handleClaimPayment}> Claim Payment</button><br/>
      <button onClick= {handleConfirmDeliver}> Confirm Deliver</button><br/>
      <button onClick= {handleDenyDeliver}> Deny Deliver</button><br/>
      <button onClick= {handleAgentTransfer}> Agent Transfer</button><br/>
      <button onClick= {handleStatus}> Get Status</button><br/>
    </div>
  );
}