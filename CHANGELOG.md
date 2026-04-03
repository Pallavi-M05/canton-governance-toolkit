# Changelog — Canton Governance Toolkit

## [0.3.0] — 2026-04-03

### Added
- `Governance/Proposal.daml` — multi-voter proposal with quorum and deadline
- `Governance/Vote.daml` — keyed vote contract with change/withdraw; `VoteTally`
- `Governance/Quorum.daml` — quorum checker with participation enforcement
- `Governance/TimeLock.daml` — time-locked execution window with cancel + extend
- `Governance/Veto.daml` — guardian veto with expiry window
- `Governance/Delegation.daml` — proxy vote delegation with expiry and revocation
- `GovernanceTest.daml` — full lifecycle tests (pass, fail, quorum edge cases)
- `SVGovernance.daml` — SV group governance example (Goldman/HSBC/BNP/Broadridge)
- CI pipeline (Daml build + test)
- Customisation guide and security model documentation
- React `ProposalBoard` UI with quorum progress bar

## [0.1.0] — 2026-03-20

### Added
- Initial project scaffolding, README, daml.yaml
