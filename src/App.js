import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import greetABI from "./utils/WavePortal.json";
import petABI from "./utils/PetVote.json";

export default function App() {
  const [hasMetaMask, setHasMetaMask] = React.useState(false);
  const [currentAcc, setCurrentAcc] = React.useState(null);

  React.useEffect(() => {
    checkIfWalletIsConnected();
  // eslint-disable-next-line
  }, []);

  const checkIfWalletIsConnected = () => {
    const { ethereum } = window;
    if (ethereum) {
      setHasMetaMask(true);
    } else {
      console.log("No metamask detected");
      return;
    }

    getCurrentAccount();
  }

  const getCurrentAccount = () => {
    const { ethereum } = window;
    ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account, nice: ", account);
        setCurrentAcc(account);
      } else {
        console.log("No authorized account found");
      }
    });
  }
  
  const connectWallet = () => {
    const { ethereum } = window;
    ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
      const account = accounts[0] || null;
      console.log("Connected", account);
      setCurrentAcc(account);
    }).catch(err => { window.alert("Something happened, try again!"); console.log(err); })
  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        {!hasMetaMask &&
          <p className="bio">
            It seems you do not have metamask installed on your browser!
          </p>
        }
        {hasMetaMask && !currentAcc &&
        <React.Fragment>
          <div className="header">
            <span role="img" aria-label="wave-emoji">👋</span>
              Hello, you need to connect a wallet to continue
            </div>
            <button className="baseButton waveButton" onClick={connectWallet}>
              Connect your Wallet
            </button>
          </React.Fragment>
        }
        {hasMetaMask && currentAcc && <AppModules />}
      </div>
    </div>
  );
}

const GREET = "GREET";
const PETS = "PETS";

function AppModules() {
  const [selection, setSelection] = React.useState("");

  const selectGreet = () => {
    setSelection(GREET);
  }

  const selectPets = () => {
    setSelection(PETS);
  }

  const clearSelection = () => {
    setSelection("");
  }

  return (
    <React.Fragment>
      <div className="header">
        {!selection &&
          <p>
            <span role="img" aria-label="wave-emoji">👋</span>
            Welcome! I decided to have my cake and eat it too, that means
            there are 2 contracts available 😀.
          </p>
        }
        {selection === GREET && <p>
          Good! manners are important, <br/> just kidding!
          </p>
        }
        {selection === PETS && <p>
          I like trains 🚂 <br/> just kidding!
          </p>
        }
      </div>
      {!selection &&
        <div className="selectionRow">
          <button className="baseButton waveButton" onClick={selectGreet}>
            Greet!
          </button>
          <button className="baseButton petButton" onClick={selectPets}>
            Pets!
          </button>
        </div>
      }
      {selection === GREET && <GreetComponent />}
      {selection === PETS && <PetComponent />}
      {selection &&
        <button className="floatingButton" onClick={clearSelection}>
          X
        </button>
      }
    </React.Fragment>
    );
}

const useGreetContract = () => {
  const greetContractAddr = "0x6c7a9ff75Bd8C6C14672aee986336713633179A8";
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const waveportalContract = new ethers.Contract(greetContractAddr, greetABI.abi, signer);

  return waveportalContract;
}

function GreetComponent() {
  const [isMining, setIsMining] = React.useState(false);
  const [waveCount, setWaveCount] = React.useState(0);
  const [allWaves, setAllWaves] = React.useState([]);
  const [message, setMessage] = React.useState("");

  const waveportalContract = React.useMemo(useGreetContract, []);

  React.useEffect(() => {
    const initWaves = async () => {
      await getTotalWaves();
      await getAllWaves();
    }
    initWaves();
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    const listener = (from, timestamp, message) => {
      setAllWaves(oldArray => [...oldArray, {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      }]);
      setWaveCount(allWaves.length + 1);
    };
    waveportalContract.on("NewWave", listener);
    
    return () => waveportalContract.off("NewWave", listener);
    // eslint-disable-next-line
  }, []);

  const getTotalWaves = async () => {
    let count = await waveportalContract.getTotalWaves();
    setWaveCount(count.toNumber());
  }

  const getAllWaves = async () => {
    let waves = await waveportalContract.getAllWaves();

    let wavesCleaned = [];
    waves.forEach(wave => {
      wavesCleaned.push({
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message,
      });
    });
    setAllWaves(wavesCleaned);
  }

  const wave = async () => {
    // Start mining process
    try {
      setIsMining(true);
      const waveTxn = await waveportalContract.wave(message, { gasLimit: 300000 });
      console.log("Mining...", waveTxn.hash);
      await waveTxn.wait();
      console.log("Mined --", waveTxn.hash);
    } catch (e) {
      window.alert("Oops, something happened, did you cancel the transaction?");
    } finally {
      setIsMining(false);
      setMessage("");
    }
  }

  return (
    <React.Fragment>
      <p className="bio">{waveCount} have said hello so far! o(*￣▽￣*)ブ</p>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <label className="label">
          Hope you are enjoying the course!, how is it going on your end?
          <input placeholder="Input a message" className="textInput" type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
      </form>
      <button className="baseButton waveButton" onClick={wave} disabled={isMining || !message}>
        {!isMining ? (
          <span>
            Say Hello! <span role="img" aria-label="wave-emoji">👋</span>
          </span>
        ) : (
          <span>
            Mining...
          </span>
        )
        }
      </button>
      {allWaves.map((wave) => {
        const key = wave.address + wave.timestamp.toString();
        return (
          <div key={key} className="baseCard greetCard">
            <div className="infoEntry"><span>Address:</span> {wave.address}</div>
            <div className="infoEntry"><span>Time:</span> {wave.timestamp.toString()}</div>
            <div className="infoEntry"><span>Message:</span> {wave.message}</div>
          </div>
        )
      })}
    </React.Fragment>
  )
}

const usePetContract = () => {
  const petContractAddr = "0x60f9090f4aeb17309969DE6EAF8081b5AD8F4663";
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const petVoteContract = new ethers.Contract(petContractAddr, petABI.abi, signer);

  return petVoteContract;
}

function PetComponent() {
  const [isMining, setIsMining] = React.useState(false);
  const [options, setOptions] = React.useState([]);
  const [voteHistory, setVoteHistory] = React.useState([]);
  const [reason, setReason] = React.useState("");
  const [alreadyVoted, setAlreadyVoted] = React.useState(false);

  const petVoteContract = React.useMemo(usePetContract, []);

  React.useEffect(() => {
    const initVotes = async () => {
      await getOptions();
      await getVoteHistory();
      await userVoted();
    }
    initVotes();
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    const listener = (from, timestamp, reason, petName) => {
      // New vote came
      setVoteHistory(oldArray => [...oldArray, {
        address: from,
        vote: petName,
        reason: reason,
      }]);

      // We know which options we have along with the vote count
      // So we can just iterate and update the vote count we have locally
      let currentVotes = [...options];
      let updatedVotes = currentVotes.map(vote => {
        if (vote.pet === petName) {
          return {
            ...vote,
            voteCount: vote.voteCount += 1,
          }
        } else {
          return { ...vote };
        }
      });

      setOptions(updatedVotes);
    };
    petVoteContract.on("NewVote", listener);
    
    return () => petVoteContract.off("NewVote", listener);
    // eslint-disable-next-line
  }, []);

  const userVoted = async () => {
    let didUserVote = await petVoteContract.alreadyVoted();
    setAlreadyVoted(didUserVote);
  }
  const getOptions = async () => {
    let options = await petVoteContract.getOptions();

    let optionsCleaned = [];
    options.forEach(option => {
      optionsCleaned.push({
        pet: option.petName,
        voteCount: option.voteCount.toNumber(),
      });
    });
    setOptions(optionsCleaned);
  }

  const getVoteHistory = async () => {
    let history = await petVoteContract.getVoteHistory();

    let historyCleaned = [];
    history.forEach(vote => {
      historyCleaned.push({
        address: vote.voter,
        reason: vote.reason,
        vote: vote.vote
      });
    });
    setVoteHistory(historyCleaned);
  }

  const getPetLabel = (pet) => {
    switch (pet) {
      default:
      case 'Dogs':
        return `${pet} 🐶 Your best friend`;
      case 'Cats':
        return `${pet} 🐱 loves you dearly deep inside`;
      case 'Birds':
        return `${pet} 🐦 sings and sometimes tells jokes!`;
      case 'Fishes':
        return `${pet} 🐟 dances in your aquarium`;
      case 'Turtles':
        return `${pet} 🐢 chills so hard it goes missing without moving`;
    }
  }

  const vote = async (pet) => {
    // Start mining process
    try {
      setIsMining(true);
      const voteTxn = await petVoteContract.vote(pet, reason, { gasLimit: 300000 });
      console.log("Mining...", voteTxn.hash);
      await voteTxn.wait();
      console.log("Mined --", voteTxn.hash);
    } catch (e) {
      window.alert("Oops, something happened, did you cancel the transaction?");
    } finally {
      setAlreadyVoted(true);
      setIsMining(false);
      setReason("");
    }
  }

  return (
    <React.Fragment>
      {alreadyVoted ? (
        <p className="bio">Thanks for participating! only one vote per person</p>
      ) : (
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <label className="label">
          🐱 🐶 Time to get serious, which pet is the best!? 🐦 🐢 🐟
          <input placeholder="Input a reason" className="textInput" type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </form>
      )}
      
      <div className="petVoteContainer">
        {options.map(option => {
          return (
            <div key={option.pet} className="petVoteCard">
              <h4>{getPetLabel(option.pet)}</h4>
              <p>{`${option.voteCount} votes!`}</p>
              {!alreadyVoted && 
                <button className="baseButton petButton" onClick={() => vote(option.pet)} disabled={isMining || !reason}>
                  {!isMining ? (
                    <span>
                      Vote!
                    </span>
                  ) : (
                    <span>
                      Mining...
                    </span>
                  )
                  }
                </button>
              }
            </div>
          )
        })}
      </div>
      <div style={{ paddingTop: "14px" }}>
        {voteHistory.map((vote) => {
          const key = vote.address + vote.pet;
          return (
            <div key={key} className="baseCard petCard">
              <div className="infoEntry"><span>Address:</span> {vote.address}</div>
              <div className="infoEntry"><span>Vote:</span> {vote.vote}</div>
              <div className="infoEntry"><span>Reason:</span> {vote.reason}</div>
            </div>
          )
        })}
      </div>
    </React.Fragment>
  )
}