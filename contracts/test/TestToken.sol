// SPDX-License-Identifier: ISC
pragma solidity 0.7.5;

import { ERC20PresetMinterPauser } from "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract TestToken is ERC20PresetMinterPauser {
  constructor(string memory name, string memory symbol, uint256 supply) ERC20PresetMinterPauser(name, symbol) {
    _mint(msg.sender, supply);
  }
}
