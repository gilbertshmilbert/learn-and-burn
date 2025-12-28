// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * Learn & Burn Platform
 * Platform for learning about FHE technology
 */
contract ZamaLearning is ZamaEthereumConfig {
    
    struct Test {
        address creator;
        string title;
        string description;
        uint256 questionCount;
        uint256 maxScore;
        uint256 createdAt;
        bool isActive;
    }
    
    struct TestScore {
        address student;
        uint256 testId;
        euint32 encryptedScore;
        uint256 submittedAt;
        uint256 attemptNumber;
    }
    
    mapping(uint256 => Test) public tests;
    mapping(uint256 => TestScore[]) public testScores;
    mapping(uint256 => mapping(address => uint256)) public userAttemptCount;
    mapping(address => uint256[]) public userTests;
    mapping(address => uint256[]) public userCompletedTests;
    
    uint256 public testCounter;
    
    event TestCreated(
        uint256 indexed testId,
        address indexed creator,
        string title,
        uint256 questionCount,
        uint256 maxScore
    );
    
    event ScoreSubmitted(
        uint256 indexed testId,
        address indexed student,
        uint256 attemptNumber
    );
    
    event TestDeactivated(
        uint256 indexed testId,
        address indexed creator
    );
    
    function createTest(
        string memory _title,
        string memory _description,
        uint256 _questionCount,
        uint256 _maxScore
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_questionCount > 0, "Question count must be greater than 0");
        require(_maxScore > 0, "Max score must be greater than 0");
        
        uint256 testId = testCounter;
        testCounter++;
        
        tests[testId] = Test({
            creator: msg.sender,
            title: _title,
            description: _description,
            questionCount: _questionCount,
            maxScore: _maxScore,
            createdAt: block.timestamp,
            isActive: true
        });
        
        userTests[msg.sender].push(testId);
        
        emit TestCreated(testId, msg.sender, _title, _questionCount, _maxScore);
        return testId;
    }
    
    function submitScore(
        uint256 _testId,
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external {
        Test storage test = tests[_testId];
        require(test.creator != address(0), "Test does not exist");
        require(test.isActive, "Test is not active");
        
        uint256 attemptNumber = userAttemptCount[_testId][msg.sender] + 1;
        userAttemptCount[_testId][msg.sender] = attemptNumber;
        
        euint32 score = FHE.fromExternal(encryptedScore, inputProof);
        FHE.allow(score, msg.sender);
        FHE.allow(score, test.creator);
        
        testScores[_testId].push(TestScore({
            student: msg.sender,
            testId: _testId,
            encryptedScore: score,
            submittedAt: block.timestamp,
            attemptNumber: attemptNumber
        }));
        
        bool alreadyInList = false;
        for (uint256 i = 0; i < userCompletedTests[msg.sender].length; i++) {
            if (userCompletedTests[msg.sender][i] == _testId) {
                alreadyInList = true;
                break;
            }
        }
        if (!alreadyInList) {
            userCompletedTests[msg.sender].push(_testId);
        }
        
        emit ScoreSubmitted(_testId, msg.sender, attemptNumber);
    }
    
    function deactivateTest(uint256 _testId) external {
        Test storage test = tests[_testId];
        require(test.creator == msg.sender, "Only creator can deactivate test");
        require(test.isActive, "Test is already inactive");
        
        test.isActive = false;
        emit TestDeactivated(_testId, msg.sender);
    }
    
    function getTest(uint256 _testId) external view returns (
        address creator,
        string memory title,
        string memory description,
        uint256 questionCount,
        uint256 maxScore,
        uint256 createdAt,
        bool isActive
    ) {
        Test storage test = tests[_testId];
        require(test.creator != address(0), "Test does not exist");
        
        return (
            test.creator,
            test.title,
            test.description,
            test.questionCount,
            test.maxScore,
            test.createdAt,
            test.isActive
        );
    }
    
    function getTestScores(uint256 _testId) external view returns (
        TestScore[] memory scores
    ) {
        require(tests[_testId].creator != address(0), "Test does not exist");
        return testScores[_testId];
    }
    
    function getUserAttemptCount(uint256 _testId, address _user) external view returns (uint256) {
        return userAttemptCount[_testId][_user];
    }
    
    function getUserTests(address _user) external view returns (uint256[] memory) {
        return userTests[_user];
    }
    
    function getUserCompletedTests(address _user) external view returns (uint256[] memory) {
        return userCompletedTests[_user];
    }
    
    function getActiveTests(uint256 _limit) external view returns (uint256[] memory) {
        uint256[] memory activeTests = new uint256[](_limit);
        uint256 count = 0;
        
        for (uint256 i = testCounter; i > 0 && count < _limit; i--) {
            uint256 testId = i - 1;
            Test storage test = tests[testId];
            
            if (test.creator != address(0) && test.isActive) {
                activeTests[count] = testId;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeTests[i];
        }
        
        return result;
    }
}

