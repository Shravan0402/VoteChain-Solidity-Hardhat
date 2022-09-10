const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const ether = tokens 

describe("Checking the voting smart contracts :- ", ()=>{
    let deployer, electionCreator, candidate1, candidate2, notEligibleVoter, voter1, voter2, voteChainContract, NFTContract;
    beforeEach(async()=>{
        let accounts = await ethers.getSigners();
        deployer = accounts[0]
        electionCreator = accounts[1]
        candidate1 = accounts[2]
        notEligibleVoter = accounts[3]
        voter1 = accounts[4]
        voter2 = accounts[5]
        candidate2 = accounts[6]
        NFTContract = await ethers.getContractFactory("TokenERC721")
        NFTContract = await NFTContract.deploy()
        voteChainContract = await ethers.getContractFactory("VoteChain")
        voteChainContract = await voteChainContract.deploy()
        await NFTContract.safeMint(voter1.address)
        await NFTContract.safeMint(voter2.address)
    })
    
    it("Checking only if the election creator can start the review period",  async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        expect(async()=> await voteChainContract.connect(candidate1).startReviewPeriod(index.value.toString(), 5)).to.be.revertedWith("Only the election creator can start the review period")
    })

    it("Check only if the election creator can review candidates", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 5)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        expect(async()=> await voteChainContract.connect(candidate1).reviewCandidate(index.value.toString(),0,2)).to.be.revertedWith("Only the election creator can review the candidates.")
    })

    it("Check if the election creator can review candidates only after review time completes", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 5)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        expect(async()=> await voteChainContract.connect(electionCreator).reviewCandidate(index.value.toString(),0,2)).to.be.revertedWith("Let the review period be complete to start revieing the candidates")
    })

    it("Check only if the election creator can start the election time", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 2)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        expect(async()=> await voteChainContract.connect(candidate1).startElectionPeriod(index.value.toString(),6)).to.be.revertedWith("Only the election creator can start the election period")
    })

    it("Check if the election creator can start election only after review time completes", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 5)
        expect(async()=> await voteChainContract.connect(electionCreator).startElectionPeriod(index.value.toString(),6)).to.be.revertedWith("Let the review period be complete to start election")
    })

    it("Check if the election creator can start election only after he/she reviews every application", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 3)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await sleep(3000)
        expect(async()=> await voteChainContract.connect(electionCreator).startElectionPeriod(index.value.toString(),6)).to.be.revertedWith("All the candidates should be reviwed before voting starts")
    })

    it("Check if the voters can vote for the election only in the election time", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 3)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await sleep(4000)
        await voteChainContract.connect(electionCreator).reviewCandidate(index.value.toString(),0,2)
        await voteChainContract.connect(electionCreator).startElectionPeriod(index.value.toString(),2)
        await sleep(3000)
        expect(async()=> await voteChainContract.connect(voter1).voteElection(index.value.toString(),0)).to.be.revertedWith("You can only vote in the election time")
    })

    it("Check if the eligible voters can only vote for the election", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 3)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await sleep(4000)
        await voteChainContract.connect(electionCreator).reviewCandidate(index.value.toString(),0,2)
        await voteChainContract.connect(electionCreator).startElectionPeriod(index.value.toString(),2)
        expect(async()=> await voteChainContract.connect(notEligibleVoter).voteElection(index.value.toString(),0)).to.be.revertedWith("Needs exact 1 NFT as voterID to vote")
    })

    it("Check if the voters can only vote once", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 3)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await sleep(4000)
        await voteChainContract.connect(electionCreator).reviewCandidate(index.value.toString(),0,2)
        await voteChainContract.connect(electionCreator).startElectionPeriod(index.value.toString(),6)
        await voteChainContract.connect(voter1).voteElection(index.value.toString(),0)
        expect(async()=> await voteChainContract.connect(voter1).voteElection(index.value.toString(),0)).to.be.revertedWith("Already voted!!!!")
    })

    it("Check if only the election creator can start the couting of the votes", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 3)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await sleep(4000)
        await voteChainContract.connect(electionCreator).reviewCandidate(index.value.toString(),0,2)
        await voteChainContract.connect(electionCreator).startElectionPeriod(index.value.toString(),3)
        await voteChainContract.connect(voter1).voteElection(index.value.toString(),0)
        await sleep(3000)
        expect(async()=> await voteChainContract.connect(voter1).countVotes(index.value.toString())).to.be.revertedWith("Only the election creator can start the counting process")
    })

    it("Checking if users can fetch the candidates list before the creator reviews every application", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 3)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await sleep(4000)
        expect(async()=> await voteChainContract.connect(voter1).getCandidates(index.value.toString())).to.be.revertedWith("All the candidates should be reviwed before you can fetch the list")
    })

    it("Checking if creator can only access the creatorGetCandidate function ", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 3)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await sleep(4000)
        expect(async()=> await voteChainContract.connect(voter1).creatorGetCandidates(index.value.toString())).to.be.revertedWith("Only the creator can access this function")
    })


    it("Testing if candidate can apply before review time", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        expect(async()=> await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")).to.be.revertedWith("Let the election creator start the review time")
    })


    it("Testing if candidate can't apply after review time", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 5)
        await sleep(5000)
        expect(async()=> await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "B")).to.be.revertedWith("The review time ended for the election")
    })


    it("Testing if same applicant can't apply more than one time", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 60)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        expect(async()=> await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "B")).to.be.revertedWith("You can only participate once")
    })

    it("Testing the whole workflow of the contract", async()=>{
        let index = await voteChainContract.connect(electionCreator).createElection(NFTContract.address)
        await voteChainContract.connect(electionCreator).startReviewPeriod(index.value.toString(), 4)
        await voteChainContract.connect(candidate1).addCandidate(index.value.toString(), "A")
        await voteChainContract.connect(candidate2).addCandidate(index.value.toString(), "B")
        await sleep(4000)
        await voteChainContract.connect(electionCreator).reviewCandidate(index.value.toString(),0,2)
        await voteChainContract.connect(electionCreator).reviewCandidate(index.value.toString(),1,2)
        await voteChainContract.connect(electionCreator).startElectionPeriod(index.value.toString(),4)
        await voteChainContract.connect(voter1).voteElection(index.value.toString(),0)
        await voteChainContract.connect(voter2).voteElection(index.value.toString(),0)
        await sleep(4000)
        await voteChainContract.connect(electionCreator).countVotes(index.value.toString())
        let res = await voteChainContract.connect(voter1).getWinner(index.value.toString())
        expect(res.toString()).to.equal(candidate1.address)
    })
})