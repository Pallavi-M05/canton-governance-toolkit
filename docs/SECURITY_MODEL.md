# Security Model

## Threat analysis

### 1. Vote manipulation
**Attack**: Proposer creates fake voter parties to inflate For count.

**Mitigation**: The `voters` list is fixed at proposal creation time and signed
by the proposer. The `QuorumCheck` counts only votes from known voters.
Adding parties post-creation requires a new proposal.

### 2. Double voting
**Attack**: Voter casts multiple `Vote` contracts for the same proposal.

**Mitigation**: `Vote` contracts use a composite key `(proposalId, voter)`.
A second `castVote` on the same proposal will fail with a key conflict.

### 3. Vote deadline bypass
**Attack**: Proposer finalises voting before deadline, locking in a favourable result.

**Mitigation**: The `votingDeadline` is enforced in `CastVote`. Votes submitted
after the deadline are rejected. Tallying can only be triggered post-deadline.

### 4. Time-lock bypass
**Attack**: Proposer executes the payload immediately after a vote passes.

**Mitigation**: `TimeLock.Execute` asserts `now >= executeAfter`. The execution
window only opens after the mandatory review period, giving guardians time to veto.

### 5. Veto manipulation
**Attack**: Guardian vetoes every proposal, blocking governance indefinitely.

**Mitigation**: The guardian is a designated party agreed on at toolkit deployment
time. Multi-guardian veto (requiring M-of-N guardians to veto) is planned for v0.4.

### 6. Delegation abuse
**Attack**: Delegate votes against delegator's interests.

**Mitigation**: The `VoteDelegation` has an expiry (`validUntil`). Delegators
can revoke at any time via `RevokeDelegation`. Consider short delegation windows
for sensitive proposals.

## Canton privacy guarantees

All governance contracts are visible only to the signatory parties and their observers.
Third parties — including unrelated Canton participants on the same network — cannot
see proposal content, voter identities, or vote counts. Canton's privacy model provides
confidential governance out of the box.
