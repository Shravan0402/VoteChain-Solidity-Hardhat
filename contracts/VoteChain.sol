// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract VoteChain {

    enum review{PENDING, REJECT, DONE}
    
    struct election{
        address electionCreator;
        address voterIDNFT;
        address winner;
        address[] alreadyVoted;
        address[] appliedCandidates;
        review[] candidatesReview;
        string[] candidatesMetadata;
        uint256[] candidateVotes;
        uint electionStartTime;
        uint electionDuration;
        uint reviewStartTime;
        uint reviewDuration;
    }

    election[] public elections;

    function createElection(address _voterIDNFT) public payable returns(uint256){
        address[] memory _alreadyVoted;
        address[] memory _appliedCandidates;
        review[] memory _candidatesReview;
        string[] memory _candidatesMetaData;
        uint256[] memory _candidateVotes;
        elections.push(election(msg.sender, _voterIDNFT, msg.sender, _alreadyVoted, _appliedCandidates,_candidatesReview,_candidatesMetaData,_candidateVotes,0,0,0,0));
        return elections.length-1;
    }

    function startReviewPeriod(uint256 _index, uint _reviewDuartion) public{
        require(elections[_index].electionCreator == msg.sender, "Only the election creator can start the review period");
        elections[_index].reviewDuration = _reviewDuartion;
        elections[_index].reviewStartTime = block.timestamp;
    }

    function addCandidate(uint256 _index, string memory _candidateSymbol) public payable{
        require(elections[_index].reviewStartTime!=0, "Let the election creator start the review time");
        require(block.timestamp < elections[_index].reviewStartTime+elections[_index].reviewDuration, "The review time ended for the election");
        for(uint256 i=0; i<elections[_index].appliedCandidates.length; i++){
            require(elections[_index].appliedCandidates[i]!=msg.sender, "You can only participate once");
        }
        elections[_index].appliedCandidates.push(msg.sender);
        elections[_index].candidatesReview.push(review.PENDING);
        elections[_index].candidatesMetadata.push(_candidateSymbol);
        elections[_index].candidateVotes.push(0);
    }

    function reviewCandidate(uint256 _index, uint256 _candidateIndex, review _candidateReview) public{
        require(elections[_index].electionCreator == msg.sender, "Only the election creator can review the candidates.");
        require(block.timestamp >= elections[_index].reviewStartTime+elections[_index].reviewDuration, "Let the review period be complete to start revieing the candidates");
        elections[_index].candidatesReview[_candidateIndex] = _candidateReview;
    }

    function startElectionPeriod(uint256 _index, uint _electionDuartion) public{
        require(elections[_index].electionCreator == msg.sender, "Only the election creator can start the election period");
        require(block.timestamp >= elections[_index].reviewStartTime+elections[_index].reviewDuration, "Let the review period be complete to start election");
        for(uint256 i=0; i<elections[_index].appliedCandidates.length; i++){
            require(elections[_index].candidatesReview[i] != review.PENDING, "All the candidates should be reviwed before voting starts");
        }
        elections[_index].electionDuration = _electionDuartion;
        elections[_index].electionStartTime = block.timestamp;
    }

    function voteElection(uint256 _index, uint256 _candidateIndex) public{
        require(elections[_index].electionStartTime!=0, "Let the election creator start the election time");
        require(block.timestamp <= elections[_index].electionStartTime+elections[_index].electionDuration, "You can only vote in the election time");
        uint256 balance = IERC721(elections[_index].voterIDNFT).balanceOf(msg.sender);
        require(balance == 1, "Needs exact 1 NFT as voterID to vote");
        for(uint256 i=0; i<elections[_index].alreadyVoted.length; i++){
            require(elections[_index].alreadyVoted[i]!=msg.sender, "Already voted!!!!");
        }
        elections[_index].candidateVotes[_candidateIndex]++;
        elections[_index].alreadyVoted.push(msg.sender);
    }

    function countVotes(uint256 _index) public{
        require(elections[_index].electionCreator == msg.sender, "Only the election creator can start the counting process");
        require(block.timestamp >= elections[_index].electionStartTime+elections[_index].electionDuration, "Let the election time be completed to start the counting of votes");
        uint256 votes = 0;
        uint256 winnerIndex;
        for(uint256 i=0; i<elections[_index].candidateVotes.length; i++){
            if(elections[_index].candidateVotes[i] > votes){
                votes = elections[_index].candidateVotes[i];
                winnerIndex = i;
            }
        }
        elections[_index].winner = elections[_index].appliedCandidates[winnerIndex];
    }

    function getCandidates(uint256 _index) public view returns(uint256[] memory, address[] memory, string[] memory){
        uint256[] memory _selectedIndex;
        address[] memory _selectedCandidates;
        string[] memory _selectedMetadata;
        uint256 index = 0;
        for(uint256 i=0; i<elections[_index].appliedCandidates.length; i++){
            require(elections[_index].candidatesReview[i] != review.PENDING, "All the candidates should be reviwed before you can fetch the list");
            if(elections[_index].candidatesReview[i] == review.DONE){
                _selectedCandidates[index] = elections[_index].appliedCandidates[i];
                _selectedMetadata[index] = elections[_index].candidatesMetadata[i];
                _selectedIndex[index++] = i;
            }
        }
        return(_selectedIndex, _selectedCandidates, _selectedMetadata);
    }

    function creatorGetCandidates(uint256 _index) public view returns(address[] memory, string[] memory){
        require(elections[_index].electionCreator == msg.sender, "Only the creator can access this function");
        return(elections[_index].appliedCandidates, elections[_index].candidatesMetadata);
    }

    function getElection(uint256 _index) public view returns(election memory){
        return elections[_index];
    }

    function getElectionsByAddress() public view returns(uint256[] memory, election[] memory){
        election[] memory _selectedElections;
        uint256[] memory _selectedIndex;
        uint256 index;
        for(uint256 i=0; i<elections.length; i++){
            if(elections[i].electionCreator == msg.sender){
                _selectedElections[index] = elections[i];
                _selectedIndex[index] = i;
            }
        }
        return(_selectedIndex, _selectedElections);
    }

    function getWinner(uint256 _index) public view returns(address){
        require(elections[_index].winner!=elections[_index].electionCreator, "Winner is not yet selected");
        return elections[_index].winner;
    }

}