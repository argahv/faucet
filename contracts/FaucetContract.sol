// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./Owned.sol";
import "./Logger.sol";
import "./IFaucet.sol";

contract Faucet is Owned, Logger, IFaucet {
    uint256 public noOfFunders;

    mapping(address => bool) private funders;
    mapping(uint256 => address) private lutFunders; //look up table

    modifier limitWithdrawal(uint256 _amount) {
        require(_amount <= 1 ether, "You can only withdraw 1 ether at a time");
        _;
    }

    receive() external payable {}

    function emitLog() public pure override returns (bytes32) {
        return "Faucet contract deployed";
    }

    function addFunds() external payable override {
        address funder = msg.sender;
        if (!funders[funder]) {
            uint256 index = noOfFunders++;
            funders[funder] = true;
            lutFunders[index] = funder;
        }
    }

    function withdraw(uint256 withdrawAmount)
        external
        override
        limitWithdrawal(withdrawAmount)
    {
        payable(msg.sender).transfer(withdrawAmount);
    }

    function getFundersAtIndex(uint8 index) external view returns (address) {
        return lutFunders[index];
    }

    function getAllFunders() external view returns (address[] memory) {
        address[] memory _funders = new address[](noOfFunders);
        for (uint256 i = 0; i < noOfFunders; i++) {
            _funders[i] = lutFunders[i];
        }
        return _funders;
    }
}
