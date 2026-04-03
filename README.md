# Canton Governance Toolkit

> **Reusable on-chain proposal voting and time-locked execution library for Canton.**
> Drop-in governance for any Canton application — DAOs, consortia, SV groups, and the Dev Fund itself.

[![CI](https://github.com/Pallavi-M05/canton-governance-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/Pallavi-M05/canton-governance-toolkit/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## What it does

Every multi-party Canton application eventually needs governance. This toolkit provides
production-ready Daml contracts for the full governance lifecycle — so teams don't build
voting logic from scratch.

| Feature | Contract |
|---|---|
| Proposal creation | `Governance/Proposal.daml` |
| For / against / abstain voting | `Governance/Vote.daml` |
| Quorum threshold enforcement | `Governance/Quorum.daml` |
| Time-lock before execution | `Governance/TimeLock.daml` |
| Guardian veto window | `Governance/Veto.daml` |
| Vote delegation to proxy | `Governance/Delegation.daml` |

## Quickstart

```bash
git clone https://github.com/Pallavi-M05/canton-governance-toolkit.git
cd canton-governance-toolkit
daml build
daml test
```

## Integration (15 minutes)

```daml
import Governance.Proposal
import Governance.Vote
import Governance.Quorum

-- Create a proposal
proposalCid <- create Proposal with
  proposer     = treasury
  title        = "Increase fee buffer to 15%"
  description  = "Network conditions require a higher fee buffer."
  voters       = [alice, bob, charlie, diana]
  quorumPct    = 66
  votingDeadline = addRelTime now (days 7)
  payload      = "fee_buffer=0.15"

-- Cast votes
submit alice do exerciseCmd proposalCid CastVote with choice = For
submit bob   do exerciseCmd proposalCid CastVote with choice = For
submit charlie do exerciseCmd proposalCid CastVote with choice = Against

-- Check quorum and advance to time-lock
submit treasury do exerciseCmd proposalCid FinaliseVoting
```

See [`docs/CUSTOMISATION_GUIDE.md`](docs/CUSTOMISATION_GUIDE.md) for configuration options.

## License

[Apache 2.0](LICENSE) — © 2026 Pallavi Makhija
