// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CampaignLedger
 * @dev A transparent donation & expense tracking system on blockchain.
 * Source of truth for all campaign donations and expenses.
 * Features: campaign milestones, donation tracking, expense recording with IPFS proofs.
 */
contract CampaignLedger is AccessControl, ReentrancyGuard {
    // ============ Roles ============
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ============ Structs ============
    struct Campaign {
        uint256 id;
        address owner;
        address treasury;
        bool active;
        uint64 createdAt;
        uint256 goalWei; // Fundraising goal (0 = no goal)
    }

    struct Milestone {
        uint256 targetPercentage; // 25, 50, 75, 100
        string description;
        uint64 reachedAt; // timestamp when reached, 0 = not reached
        bool exists;
    }

    // ============ State Variables ============
    uint256 private _campaignCounter;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => uint256) public campaignDonations; // campaignId => total donations
    mapping(uint256 => uint256) public campaignExpenses; // campaignId => total expenses
    mapping(uint256 => mapping(uint256 => Milestone)) public campaignMilestones; // campaignId => percentage => Milestone
    mapping(uint256 => uint256[]) private _campaignMilestoneKeys; // campaignId => array of percentages

    // ============ Events ============
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed owner,
        address treasury,
        uint64 createdAt
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed from,
        uint256 amountWei,
        uint256 timestamp,
        bytes32 txHashRef
    );

    event ExpenseRecorded(
        uint256 indexed campaignId,
        address indexed spender,
        uint256 amountWei,
        string category,
        string cid,
        string note,
        uint256 timestamp,
        bytes32 txHashRef
    );

    event CampaignStatusChanged(
        uint256 indexed campaignId,
        bool active
    );

    event CampaignGoalSet(
        uint256 indexed campaignId,
        uint256 goalWei
    );

    event MilestoneSet(
        uint256 indexed campaignId,
        uint256 targetPercentage,
        string description
    );

    event MilestoneReached(
        uint256 indexed campaignId,
        uint256 targetPercentage,
        uint256 currentAmount,
        uint256 goalAmount,
        uint64 timestamp
    );

    // ============ Errors ============
    error CampaignDoesNotExist(uint256 campaignId);
    error CampaignNotActive(uint256 campaignId);
    error InvalidTreasury();
    error InvalidDonationAmount();
    error EmptyCID();
    error EmptyCategory();
    error UnauthorizedOperator();
    error InvalidMilestonePercentage();
    error NoGoalSet();

    // ============ Constructor ============
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    // ============ Modifiers ============
    modifier campaignExists(uint256 campaignId) {
        if (campaigns[campaignId].owner == address(0)) {
            revert CampaignDoesNotExist(campaignId);
        }
        _;
    }

    modifier campaignActive(uint256 campaignId) {
        if (!campaigns[campaignId].active) {
            revert CampaignNotActive(campaignId);
        }
        _;
    }

    // ============ External Functions ============

    /**
     * @dev Creates a new campaign
     * @param treasury The address where donations will be forwarded
     * @return campaignId The ID of the newly created campaign
     */
    function createCampaign(address treasury) external returns (uint256) {
        if (treasury == address(0)) {
            revert InvalidTreasury();
        }

        _campaignCounter++;
        uint256 campaignId = _campaignCounter;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            owner: msg.sender,
            treasury: treasury,
            active: true,
            createdAt: uint64(block.timestamp),
            goalWei: 0
        });

        emit CampaignCreated(
            campaignId,
            msg.sender,
            treasury,
            uint64(block.timestamp)
        );

        return campaignId;
    }

    /**
     * @dev Set fundraising goal for a campaign
     * @param campaignId The campaign to set goal for
     * @param goalWei The goal amount in wei
     */
    function setCampaignGoal(uint256 campaignId, uint256 goalWei)
        external
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        if (msg.sender != campaign.owner && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedOperator();
        }

        campaign.goalWei = goalWei;
        emit CampaignGoalSet(campaignId, goalWei);
    }

    /**
     * @dev Set a milestone for a campaign
     * @param campaignId The campaign
     * @param targetPercentage Percentage target (1-100)
     * @param description Milestone description
     */
    function setMilestone(
        uint256 campaignId,
        uint256 targetPercentage,
        string calldata description
    )
        external
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        if (msg.sender != campaign.owner && !hasRole(OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedOperator();
        }

        if (targetPercentage == 0 || targetPercentage > 100) {
            revert InvalidMilestonePercentage();
        }

        if (campaign.goalWei == 0) {
            revert NoGoalSet();
        }

        if (!campaignMilestones[campaignId][targetPercentage].exists) {
            _campaignMilestoneKeys[campaignId].push(targetPercentage);
        }

        campaignMilestones[campaignId][targetPercentage] = Milestone({
            targetPercentage: targetPercentage,
            description: description,
            reachedAt: 0,
            exists: true
        });

        emit MilestoneSet(campaignId, targetPercentage, description);
    }

    /**
     * @dev Donate to a campaign
     * @param campaignId The campaign to donate to
     */
    function donate(uint256 campaignId)
        external
        payable
        nonReentrant
        campaignExists(campaignId)
        campaignActive(campaignId)
    {
        if (msg.value == 0) {
            revert InvalidDonationAmount();
        }

        Campaign storage campaign = campaigns[campaignId];

        // Forward donation to treasury
        (bool success, ) = campaign.treasury.call{value: msg.value}("");
        require(success, "Transfer to treasury failed");

        campaignDonations[campaignId] += msg.value;

        emit DonationReceived(
            campaignId,
            msg.sender,
            msg.value,
            block.timestamp,
            blockhash(block.number - 1)
        );

        // Check milestones
        if (campaign.goalWei > 0) {
            _checkMilestones(campaignId);
        }
    }

    /**
     * @dev Record an expense for a campaign
     * @param campaignId The campaign to record expense for
     * @param amountWei The amount spent in wei
     * @param category The expense category
     * @param cid The IPFS CID of the proof document
     * @param note Additional notes
     */
    function recordExpense(
        uint256 campaignId,
        uint256 amountWei,
        string calldata category,
        string calldata cid,
        string calldata note
    )
        external
        campaignExists(campaignId)
        campaignActive(campaignId)
    {
        // Check authorization: must be owner or have OPERATOR_ROLE
        Campaign storage campaign = campaigns[campaignId];
        if (msg.sender != campaign.owner && !hasRole(OPERATOR_ROLE, msg.sender)) {
            revert UnauthorizedOperator();
        }

        if (bytes(cid).length == 0) {
            revert EmptyCID();
        }

        if (bytes(category).length == 0) {
            revert EmptyCategory();
        }

        campaignExpenses[campaignId] += amountWei;

        emit ExpenseRecorded(
            campaignId,
            msg.sender,
            amountWei,
            category,
            cid,
            note,
            block.timestamp,
            blockhash(block.number - 1)
        );
    }

    /**
     * @dev Set campaign active status
     * @param campaignId The campaign to update
     * @param active The new active status
     */
    function setCampaignActive(uint256 campaignId, bool active)
        external
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];

        // Only owner or admin can change status
        if (msg.sender != campaign.owner && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedOperator();
        }

        campaign.active = active;

        emit CampaignStatusChanged(campaignId, active);
    }

    // ============ Internal Functions ============

    /**
     * @dev Check and emit milestone events after a donation
     */
    function _checkMilestones(uint256 campaignId) internal {
        Campaign storage campaign = campaigns[campaignId];
        uint256 currentAmount = campaignDonations[campaignId];
        uint256 currentPercentage = (currentAmount * 100) / campaign.goalWei;

        uint256[] storage keys = _campaignMilestoneKeys[campaignId];
        for (uint256 i = 0; i < keys.length; i++) {
            Milestone storage milestone = campaignMilestones[campaignId][keys[i]];
            if (milestone.exists && milestone.reachedAt == 0 && currentPercentage >= milestone.targetPercentage) {
                milestone.reachedAt = uint64(block.timestamp);
                emit MilestoneReached(
                    campaignId,
                    milestone.targetPercentage,
                    currentAmount,
                    campaign.goalWei,
                    uint64(block.timestamp)
                );
            }
        }
    }

    // ============ View Functions ============

    /**
     * @dev Get campaign details
     */
    function getCampaign(uint256 campaignId)
        external
        view
        returns (Campaign memory)
    {
        return campaigns[campaignId];
    }

    /**
     * @dev Get total number of campaigns
     */
    function getCampaignCount() external view returns (uint256) {
        return _campaignCounter;
    }

    /**
     * @dev Get campaign statistics
     */
    function getCampaignStats(uint256 campaignId)
        external
        view
        returns (uint256 totalDonations, uint256 totalExpenses)
    {
        return (campaignDonations[campaignId], campaignExpenses[campaignId]);
    }

    /**
     * @dev Get milestone keys for a campaign
     */
    function getMilestoneKeys(uint256 campaignId)
        external
        view
        returns (uint256[] memory)
    {
        return _campaignMilestoneKeys[campaignId];
    }

    /**
     * @dev Get a specific milestone
     */
    function getMilestone(uint256 campaignId, uint256 targetPercentage)
        external
        view
        returns (Milestone memory)
    {
        return campaignMilestones[campaignId][targetPercentage];
    }
}
