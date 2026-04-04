# Canton Governance Toolkit

A reusable on-chain proposal, voting, and time-locked execution library for Daml applications on Canton Network.

This toolkit provides a robust and flexible framework for DAOs, consortia, and any multi-party application requiring structured decision-making processes. It allows developers to add sophisticated governance capabilities to their applications with minimal effort, separating governance logic from business logic.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Daml Version](https://img.shields.io/badge/Daml-3.1.0-orange.svg)](https://daml.com)

## Key Features

-   **Proposal Submission**: Any designated member can submit proposals for on-chain actions.
-   **Quorum-Based Voting**: Configurable voting periods, quorum thresholds, and pass thresholds.
-   **Vote Delegation**: Members can delegate their voting power to another trusted party.
-   **Time-Locked Execution**: Approved proposals are queued in a time-lock contract, providing a window for review before execution.
-   **Veto Rights**: A designated "veto" party can cancel a queued proposal during the time-lock period.
-   **Generic & Reusable**: Designed as a library to govern any type of Daml choice on any contract.

## Why Use This Toolkit?

-   **Accelerate Development**: Focus on your core business logic instead of building complex governance mechanisms from scratch.
-   **Promote Decentralization**: Empower your application's users with transparent, on-chain decision-making.
-   **Enhance Security**: The time-lock and veto features provide crucial safeguards against malicious or flawed proposals.
-   **Improve Trust**: All governance actions—from proposal to execution—are recorded immutably on the ledger, ensuring full auditability.

---

## 15-Minute Integration Guide

Follow these steps to add Canton Governance Toolkit to your existing Daml project.

### Step 1: Add the Dependency

First, build the `canton-governance-toolkit` project to generate a `.dar` file (e.g., `.daml/dist/canton-governance-toolkit-0.1.0.dar`).

Then, in your own project's `daml.yaml`, add the path to the toolkit's `.dar` file in the `dependencies` section.

```yaml
# your-project/daml.yaml
sdk-version: 3.1.0
name: your-project
version: 0.1.0
source: daml
dependencies:
  - daml-prim
  - daml-stdlib
  - daml-script
  # Add the toolkit dependency
  - ../path/to/canton-governance-toolkit/.daml/dist/canton-governance-toolkit-0.1.0.dar
```

### Step 2: Define a Governed Action

Let's say you have a `Treasury` contract that holds funds and you want to govern the `Disburse` action. The key is to make the `Governance` contract the *only* controller of this sensitive choice.

```daml
-- your-project/daml/Treasury.daml
module Treasury where

import DA.Finance.Types (Account)
import Governance.Setup (Governance) -- Import from the toolkit

template Treasury
  with
    operator: Party
    governanceCid: ContractId Governance -- Reference to the governance contract
    funds: Account
  where
    signatory operator

    -- This choice is controlled by the governance contract, not the operator.
    choice Disburse: ContractId Treasury
      with
        recipient: Party
        amount: Decimal
      controller fetch governanceCid >>= (\g -> pure g.governor)
      do
        -- ... disbursement logic here
        create this with funds = ...
```
*Note: The `controller` is `g.governor`, which is the signatory of the `Governance` contract.*

### Step 3: Initialize Governance

In a `Daml.Script`, set up the governance rules and create the `Governance` and `Treasury` contracts.

```daml
-- your-project/daml/Main.daml (or your setup script)
module Main where

import Daml.Script
import DA.Date
import Governance.Setup
import Treasury

setup: Script ()
setup = script do
  -- 1. Define parties
  governor <- allocateParty "Governor"  -- The governor is an abstract party representing the DAO/consortium
  operator <- allocateParty "Operator"
  vetoer <- allocateParty "Vetoer"
  alice <- allocateParty "Alice"
  bob <- allocateParty "Bob"
  charlie <- allocateParty "Charlie"

  let members = [alice, bob, charlie]

  -- 2. Define governance parameters
  let
    params = GovernanceParameters with
      votingPeriod = days 7
      timeLockDelay = days 2
      quorum = 2 -- At least 2 members must vote
      passThreshold = 0.5 -- > 50% of votes cast must be "For"

  -- 3. Create the governance contract
  governanceCid <- submit governor do
    createCmd Governance with
      governor
      members
      vetoer = Some vetoer
      delegations = fromList []
      parameters = params

  -- 4. Create the contract to be governed
  treasuryCid <- submit operator do
    createCmd Treasury with
      operator
      governanceCid
      funds = ...

  pure ()
```

### Step 4: Create a Proposal

Now, any member (e.g., Alice) can propose to disburse funds from the `Treasury`.

```daml
-- Continuing the setup script...
import Governance.Proposal
import Codec.Daml.Any (AnyChoice(..), fromAnyChoice)

-- ...
  -- 5. Alice creates a proposal to disburse 100.0 to Bob
  let
    disbursePayload = Disburse with recipient = bob, amount = 100.0
    -- The payload must be wrapped in AnyChoice
    choiceArgument = fromAnyChoice @(Disburse) disbursePayload

  proposalCid <- submit alice do
    exerciseCmd governanceCid CreateProposal with
      proposer = alice
      proposalId = "Q1-Disbursement-001"
      description = "Disburse 100.0 to Bob for services rendered."
      targetCid = toAnyContractId treasuryCid
      choiceName = "Disburse"
      choiceArgument
```

### Step 5: Vote on the Proposal

Once a proposal is created, a `Ballot` contract is created for each member. They can then cast their vote.

```daml
-- Continuing the setup script...
-- ...
  -- 6. Members cast their votes
  -- Find the ballots created for this proposal
  aliceBallotCid <- queryContractId alice (locate $ BallotKey alice "Q1-Disbursement-001")
  bobBallotCid <- queryContractId bob (locate $ BallotKey bob "Q1-Disbursement-001")

  submit alice do exerciseCmd aliceBallotCid CastVote with vote = For
  submit bob do exerciseCmd bobBallotCid CastVote with vote = For
  -- Charlie abstains or votes against
```

### Step 6: Tally Votes & Queue for Execution

After the voting period ends, anyone can tally the votes. If the proposal passes, a `TimeLock` contract is created.

```daml
-- Continuing the setup script...
import Governance.TimeLock

-- ...
  -- 7. Advance time past the voting period
  advanceTime (days 8)

  -- 8. Tally the votes (anyone can do this)
  -- The original proposal contract is archived and a TimeLock is created
  timeLockCid <- submit governor do
    exerciseCmd proposalCid TallyVotes

  -- The proposal passed with 2/2 "For" votes, meeting the quorum and threshold.
  -- A `TimeLock` contract is now active.
  timeLock <- fetch timeLockCid
  assert (timeLock.status == Queued)
```

### Step 7: Execute the Governed Action

After the time-lock delay passes, the `governor` can execute the action.

```daml
-- Continuing the setup script...
-- ...
  -- 9. Advance time past the time-lock delay
  advanceTime (days 2)

  -- 10. Execute the action
  -- This will finally call the `Disburse` choice on the `Treasury` contract
  (archivedTimeLock, result) <- submit governor do
    exerciseCmd timeLockCid Execute

  -- Verify the treasury state has changed
  updatedTreasury <- fetch treasuryCid
  -- ... assert updated state
```

Congratulations! You have successfully integrated a full governance lifecycle into your application.

## Advanced Features

### Veto

During the time-lock period, the designated `vetoer` party can exercise the `Veto` choice on the `TimeLock` contract to prevent execution. This is a powerful safeguard against malicious or erroneous proposals that manage to pass the voting stage.

### Delegation

A member can delegate their voting power by exercising the `DelegateVote` choice on the `Governance` contract. When votes are tallied, the delegate's vote is weighted by the sum of their own power plus that of all parties who have delegated to them.

## Running the Example Project

To run the tests included with this toolkit:

1.  **Start the Ledger**:
    ```bash
    daml start
    ```

2.  **Build the DAR file**:
    ```bash
    daml build
    ```

3.  **Run the tests**:
    ```bash
    daml test
    ```

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.