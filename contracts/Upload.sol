// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Upload {
    struct Access {
        address user;
        bool access;
    }

    mapping(address => string[]) private value;
    mapping(address => mapping(address => bool)) private ownership;
    mapping(address => Access[]) private accessList;
    mapping(address => mapping(address => bool)) private previousData;

    event FileAdded(address indexed owner, string url);
    event AccessGranted(address indexed owner, address indexed user);
    event AccessRevoked(address indexed owner, address indexed user);

    function add(string calldata url) external {
        require(bytes(url).length > 0, "File URL cannot be empty");
        value[msg.sender].push(url);
        emit FileAdded(msg.sender, url);
    }

    function allow(address user) external {
        require(user != address(0), "Invalid user address");
        require(user != msg.sender, "Owner already has access");

        ownership[msg.sender][user] = true;

        if (previousData[msg.sender][user]) {
            for (uint256 i = 0; i < accessList[msg.sender].length; i++) {
                if (accessList[msg.sender][i].user == user) {
                    accessList[msg.sender][i].access = true;
                    break;
                }
            }
        } else {
            accessList[msg.sender].push(Access(user, true));
            previousData[msg.sender][user] = true;
        }

        emit AccessGranted(msg.sender, user);
    }

    function disallow(address user) external {
        require(user != address(0), "Invalid user address");

        ownership[msg.sender][user] = false;

        for (uint256 i = 0; i < accessList[msg.sender].length; i++) {
            if (accessList[msg.sender][i].user == user) {
                accessList[msg.sender][i].access = false;
                break;
            }
        }

        emit AccessRevoked(msg.sender, user);
    }

    function display(address owner) external view returns (string[] memory) {
        require(
            owner == msg.sender || ownership[owner][msg.sender],
            "You don't have access"
        );
        return value[owner];
    }

    function shareAccess() external view returns (Access[] memory) {
        return accessList[msg.sender];
    }
}
